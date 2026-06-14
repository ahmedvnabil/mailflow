import { schemaStatements } from "./schema";
import { redactSecrets } from "./security";
import type {
  ActionResult,
  EmailEventRecord,
  EmailInput,
  Env,
  EventStatus,
  MatchMode,
  RuleAction,
  RuleConditions,
  RuleRecord,
  SettingRecord
} from "./types";

const SECRET_KEYS = new Set(["admin_api_key", "telegram_bot_token", "telegram_chat_id", "openai_api_key", "openrouter_api_key"]);

const schemaReady = new WeakMap<D1Database, Promise<void>>();

export async function ensureSchema(env: Env): Promise<void> {
  if (!schemaReady.has(env.DB)) {
    schemaReady.set(env.DB, (async () => {
      for (const statement of schemaStatements()) {
        await env.DB.prepare(statement).run();
      }
    })());
  }
  await schemaReady.get(env.DB);
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function bool(value: unknown): boolean {
  return Number(value) === 1;
}

function mapRule(row: Record<string, unknown>): RuleRecord {
  return {
    id: Number(row.id),
    name: String(row.name),
    active: bool(row.active),
    priority: Number(row.priority),
    matchMode: String(row.match_mode) === "any" ? "any" : "all",
    conditions: parseJson<RuleConditions>(row.conditions_json, {}),
    actions: parseJson<RuleAction[]>(row.actions_json, []),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    lastMatchedAt: row.last_matched_at ? String(row.last_matched_at) : null
  };
}

function mapEvent(row: Record<string, unknown>): EmailEventRecord {
  return {
    id: Number(row.id),
    messageId: String(row.message_id),
    fromEmail: String(row.from_email),
    toEmail: String(row.to_email),
    subject: String(row.subject),
    bodyPreview: String(row.body_preview),
    hasAttachments: bool(row.has_attachments),
    matchedRules: parseJson<Array<{ id: number; name: string }>>(row.matched_rules_json, []),
    actions: parseJson<ActionResult[]>(row.actions_json, []),
    status: String(row.status) as EventStatus,
    error: row.error ? String(row.error) : null,
    receivedAt: String(row.received_at)
  };
}

export function normalizeRulePayload(payload: unknown): Omit<RuleRecord, "id" | "createdAt" | "updatedAt" | "lastMatchedAt"> {
  const source = (payload || {}) as Partial<RuleRecord>;
  return {
    name: String(source.name || "Untitled rule").trim().slice(0, 120),
    active: source.active !== false,
    priority: Number.isFinite(Number(source.priority)) ? Number(source.priority) : 100,
    matchMode: source.matchMode === "any" ? "any" : "all",
    conditions: (source.conditions || {}) as RuleConditions,
    actions: Array.isArray(source.actions) ? source.actions : []
  };
}

export async function listRules(env: Env, activeOnly = false): Promise<RuleRecord[]> {
  await ensureSchema(env);
  const query = activeOnly
    ? "SELECT * FROM rules WHERE active = 1 ORDER BY priority ASC, id ASC"
    : "SELECT * FROM rules ORDER BY priority ASC, id ASC";
  const result = await env.DB.prepare(query).all<Record<string, unknown>>();
  return (result.results || []).map(mapRule);
}

export async function getRule(env: Env, id: number): Promise<RuleRecord | null> {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT * FROM rules WHERE id = ?").bind(id).first<Record<string, unknown>>();
  return row ? mapRule(row) : null;
}

export async function createRule(env: Env, payload: unknown): Promise<RuleRecord> {
  await ensureSchema(env);
  const rule = normalizeRulePayload(payload);
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO rules (name, active, priority, match_mode, conditions_json, actions_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      rule.name,
      rule.active ? 1 : 0,
      rule.priority,
      rule.matchMode,
      JSON.stringify(rule.conditions),
      JSON.stringify(rule.actions),
      now,
      now
    )
    .run();
  return (await getRule(env, Number(result.meta.last_row_id))) as RuleRecord;
}

export async function updateRule(env: Env, id: number, payload: unknown): Promise<RuleRecord | null> {
  await ensureSchema(env);
  const existing = await getRule(env, id);
  if (!existing) return null;
  const rule = normalizeRulePayload({ ...existing, ...(payload as Record<string, unknown>) });
  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE rules
     SET name = ?, active = ?, priority = ?, match_mode = ?, conditions_json = ?, actions_json = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(
      rule.name,
      rule.active ? 1 : 0,
      rule.priority,
      rule.matchMode,
      JSON.stringify(rule.conditions),
      JSON.stringify(rule.actions),
      now,
      id
    )
    .run();
  return getRule(env, id);
}

export async function deleteRule(env: Env, id: number): Promise<boolean> {
  await ensureSchema(env);
  const result = await env.DB.prepare("DELETE FROM rules WHERE id = ?").bind(id).run();
  return result.meta.changes > 0;
}

export async function touchRuleMatched(env: Env, id: number, at: string): Promise<void> {
  await env.DB.prepare("UPDATE rules SET last_matched_at = ?, updated_at = ? WHERE id = ?").bind(at, at, id).run();
}

export async function createEmailEvent(
  env: Env,
  email: EmailInput,
  status: EventStatus,
  matchedRules: Array<{ id: number; name: string }> = [],
  actions: ActionResult[] = [],
  error: string | null = null
): Promise<EmailEventRecord> {
  await ensureSchema(env);
  const result = await env.DB.prepare(
    `INSERT INTO email_events
     (message_id, from_email, to_email, subject, body_preview, has_attachments, matched_rules_json, actions_json, status, error, received_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      email.messageId,
      email.from,
      email.to,
      email.subject,
      email.bodyPreview.slice(0, 500),
      email.hasAttachments ? 1 : 0,
      JSON.stringify(matchedRules),
      JSON.stringify(actions),
      status,
      error,
      email.receivedAt
    )
    .run();
  return getEmailEvent(env, Number(result.meta.last_row_id)) as Promise<EmailEventRecord>;
}

export async function updateEmailEvent(
  env: Env,
  id: number,
  status: EventStatus,
  matchedRules: Array<{ id: number; name: string }>,
  actions: ActionResult[],
  error: string | null
): Promise<EmailEventRecord> {
  await env.DB.prepare(
    `UPDATE email_events
     SET status = ?, matched_rules_json = ?, actions_json = ?, error = ?
     WHERE id = ?`
  )
    .bind(status, JSON.stringify(matchedRules), JSON.stringify(actions), error, id)
    .run();
  return (await getEmailEvent(env, id)) as EmailEventRecord;
}

export async function getEmailEvent(env: Env, id: number): Promise<EmailEventRecord | null> {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT * FROM email_events WHERE id = ?").bind(id).first<Record<string, unknown>>();
  return row ? mapEvent(row) : null;
}

export async function getEmailEventByMessageId(env: Env, messageId: string): Promise<EmailEventRecord | null> {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT * FROM email_events WHERE message_id = ? ORDER BY id DESC LIMIT 1")
    .bind(messageId)
    .first<Record<string, unknown>>();
  return row ? mapEvent(row) : null;
}

export async function listEmailEvents(env: Env, limit = 100): Promise<EmailEventRecord[]> {
  await ensureSchema(env);
  const result = await env.DB.prepare("SELECT * FROM email_events ORDER BY received_at DESC LIMIT ?")
    .bind(Math.min(limit, 250))
    .all<Record<string, unknown>>();
  return (result.results || []).map(mapEvent);
}

export async function createActionLog(
  env: Env,
  emailEventId: number,
  ruleId: number | null,
  result: ActionResult
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO action_logs (email_event_id, rule_id, action_type, status, response_preview, error, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      emailEventId,
      ruleId,
      result.actionType,
      result.status,
      result.responsePreview ? redactSecrets(result.responsePreview) : null,
      result.error ? redactSecrets(result.error) : null,
      new Date().toISOString()
    )
    .run();
}

export async function getStats(env: Env): Promise<Record<string, number>> {
  await ensureSchema(env);
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [total, todayCount, activeRules, failedActions] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM emails").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM emails WHERE substr(received_at, 1, 10) = ?").bind(today).first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM rules WHERE active = 1").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM action_logs WHERE status = 'failed'").first<{ count: number }>()
  ]);
  const [weekCount, openTickets, activeWorkflows, storage] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM emails WHERE received_at >= ?").bind(weekAgo).first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM tickets WHERE status IN ('open', 'pending', 'waiting')").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM workflows WHERE active = 1").first<{ count: number }>(),
    env.DB.prepare("SELECT COALESCE(SUM(size), 0) AS count FROM attachments").first<{ count: number }>()
  ]);

  return {
    totalProcessed: Number(total?.count || 0),
    emailsToday: Number(todayCount?.count || 0),
    emailsThisWeek: Number(weekCount?.count || 0),
    openTickets: Number(openTickets?.count || 0),
    activeRules: Number(activeRules?.count || 0),
    activeWorkflows: Number(activeWorkflows?.count || 0),
    storageUsage: Number(storage?.count || 0),
    failedActions: Number(failedActions?.count || 0)
  };
}

export async function getSettings(env: Env, includeSecrets = false): Promise<Record<string, string | null>> {
  await ensureSchema(env);
  const result = await env.DB.prepare("SELECT * FROM settings").all<Record<string, unknown>>();
  const settings: Record<string, string | null> = {};
  for (const row of result.results || []) {
    const key = String(row.key);
    settings[key] = !includeSecrets && bool(row.encrypted_or_secret) ? null : String(row.value);
  }
  return settings;
}

export async function listSettings(env: Env): Promise<SettingRecord[]> {
  await ensureSchema(env);
  const result = await env.DB.prepare("SELECT * FROM settings ORDER BY key ASC").all<Record<string, unknown>>();
  return (result.results || []).map((row) => ({
    key: String(row.key),
    value: bool(row.encrypted_or_secret) ? "" : String(row.value),
    encryptedOrSecret: bool(row.encrypted_or_secret),
    updatedAt: String(row.updated_at)
  }));
}

export async function updateSettings(env: Env, values: Record<string, unknown>): Promise<SettingRecord[]> {
  await ensureSchema(env);
  const allowed = [
    "admin_api_key",
    "telegram_bot_token",
    "telegram_chat_id",
    "default_forward_email",
    "default_webhook_url",
    "auto_reply_enabled",
    "default_inbox",
    "default_ticket_status",
    "default_ticket_priority",
    "log_retention_days",
    "attachment_retention_days",
    "ai_enabled",
    "auto_ticket_enabled",
    "workflow_retries_count",
    "max_stored_body_preview_length",
    "max_request_body_bytes",
    "max_attachment_bytes",
    "openai_api_key",
    "openrouter_api_key",
    "ollama_base_url",
    "outbound_enabled",
    "default_from_email",
    "allowed_sender_addresses",
    "max_recipients_per_request",
    "daily_send_limit",
    "require_verified_sender_warning"
  ];
  const now = new Date().toISOString();

  for (const key of allowed) {
    if (!(key in values)) continue;
    const value = values[key];
    if (SECRET_KEYS.has(key) && !value) continue;
    await env.DB.prepare(
      `INSERT INTO settings (key, value, encrypted_or_secret, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, encrypted_or_secret = excluded.encrypted_or_secret, updated_at = excluded.updated_at`
    )
      .bind(key, String(value ?? ""), SECRET_KEYS.has(key) ? 1 : 0, now)
      .run();
  }

  return listSettings(env);
}

export async function getEffectiveSetting(env: Env, key: string): Promise<string | undefined> {
  const settings = await getSettings(env, true);
  return settings[key] || undefined;
}

export async function createLogEntry(
  env: Env,
  eventType: string,
  entityType: string,
  entityId: number | null,
  status: string,
  message: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await ensureSchema(env);
  await env.DB.prepare(
    `INSERT INTO logs (event_type, entity_type, entity_id, status, message, metadata_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(eventType, entityType, entityId, status, redactSecrets(message), redactSecrets(metadata), new Date().toISOString())
    .run();
}

export async function upsertContactFromEmail(env: Env, email: EmailInput): Promise<Record<string, unknown>> {
  await ensureSchema(env);
  const now = email.receivedAt;
  const name = email.from.includes("<") ? email.from.split("<")[0].trim().replace(/^"|"$/g, "") : "";
  const addressMatch = email.from.match(/<([^>]+)>/);
  const address = (addressMatch?.[1] || email.from).trim().toLowerCase();
  await env.DB.prepare(
    `INSERT INTO contacts (name, email, total_emails, first_seen, last_seen, created_at, updated_at)
     VALUES (?, ?, 1, ?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET total_emails = total_emails + 1, last_seen = excluded.last_seen, updated_at = excluded.updated_at`
  )
    .bind(name, address, now, now, now, now)
    .run();
  return (await env.DB.prepare("SELECT * FROM contacts WHERE email = ?").bind(address).first<Record<string, unknown>>()) as Record<string, unknown>;
}

export async function createOperationalEmail(
  env: Env,
  email: EmailInput,
  legacyEventId: number,
  contactId: number | null,
  status = "received"
): Promise<Record<string, unknown>> {
  await ensureSchema(env);
  const attachments = (email.attachments || []).map((attachment) => ({
    filename: attachment.filename,
    mimeType: attachment.mimeType,
    size: attachment.size
  }));
  const result = await env.DB.prepare(
    `INSERT INTO emails
     (legacy_event_id, message_id, from_email, to_email, cc, bcc, reply_to, in_reply_to, references_ids, subject, text_body, html_body, body_preview, headers_json, attachments_json, contact_id, status, received_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      legacyEventId,
      email.messageId,
      email.from,
      email.to,
      email.cc || null,
      email.bcc || null,
      email.replyTo || null,
      email.inReplyTo || null,
      email.references || null,
      email.subject,
      email.body,
      email.htmlBody || null,
      email.bodyPreview,
      JSON.stringify(email.headers),
      JSON.stringify(attachments),
      contactId,
      status,
      email.receivedAt,
      email.receivedAt
    )
    .run();
  return (await env.DB.prepare("SELECT * FROM emails WHERE id = ?").bind(result.meta.last_row_id).first<Record<string, unknown>>()) as Record<string, unknown>;
}

export async function getOperationalEmailByMessageId(env: Env, messageId: string): Promise<Record<string, unknown> | null> {
  await ensureSchema(env);
  return env.DB.prepare("SELECT * FROM emails WHERE message_id = ? ORDER BY id DESC LIMIT 1")
    .bind(messageId)
    .first<Record<string, unknown>>();
}

export async function getOperationalEmail(env: Env, id: number): Promise<Record<string, unknown> | null> {
  await ensureSchema(env);
  return env.DB.prepare("SELECT * FROM emails WHERE id = ?").bind(id).first<Record<string, unknown>>();
}

export async function updateOperationalEmailStatus(
  env: Env,
  emailId: number,
  status: string,
  tags: string[] = [],
  classification?: string
): Promise<void> {
  await env.DB.prepare("UPDATE emails SET status = ?, tags_json = ?, classification = COALESCE(?, classification) WHERE id = ?")
    .bind(status, JSON.stringify(tags), classification || null, emailId)
    .run();
}

export async function createTicketForEmail(
  env: Env,
  emailId: number,
  contactId: number | null,
  subject: string,
  priority = "normal",
  assignedUser = ""
): Promise<Record<string, unknown>> {
  await ensureSchema(env);
  const now = new Date().toISOString();
  const ticketNumber = `MFS-${Date.now().toString(36).toUpperCase()}`;
  const result = await env.DB.prepare(
    `INSERT INTO tickets (ticket_number, subject, contact_id, email_id, status, priority, assigned_user, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?)`
  )
    .bind(ticketNumber, subject, contactId, emailId, priority, assignedUser, now, now)
    .run();
  await env.DB.prepare(
    `INSERT INTO ticket_messages (ticket_id, email_id, author_type, body, internal_note, created_at)
     VALUES (?, ?, 'contact', (SELECT body_preview FROM emails WHERE id = ?), 0, ?)`
  )
    .bind(result.meta.last_row_id, emailId, emailId, now)
    .run();
  return (await env.DB.prepare("SELECT * FROM tickets WHERE id = ?").bind(result.meta.last_row_id).first<Record<string, unknown>>()) as Record<string, unknown>;
}

export function normalizeSubject(subject: string): string {
  return String(subject || "")
    .replace(/^(\s*(re|fwd|fw|aw|tr|sv|antw)\s*:\s*)+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isReplySubject(subject: string): boolean {
  return /^\s*(re|fwd|fw|aw|tr|sv|antw)\s*:/i.test(String(subject || ""));
}

function extractMessageIds(value: string | null | undefined): string[] {
  if (!value) return [];
  const bracketed = String(value).match(/<[^>]+>/g);
  if (bracketed) return bracketed.map((token) => token.slice(1, -1).trim()).filter(Boolean);
  return String(value)
    .split(/[\s,]+/)
    .map((token) => token.replace(/^<|>$/g, "").trim())
    .filter(Boolean);
}

/**
 * Returns the id of the ticket an inbound email belongs to, when it is a reply
 * to a message we already have a ticket for. Matching is done by In-Reply-To /
 * References message ids first, then by normalized subject for the same contact
 * (only when the subject actually looks like a reply, to avoid false merges).
 */
export async function findTicketForReply(env: Env, email: EmailInput, contactId: number | null): Promise<number | null> {
  await ensureSchema(env);
  const ids = [...extractMessageIds(email.inReplyTo), ...extractMessageIds(email.references)];
  if (ids.length) {
    const placeholders = ids.map(() => "?").join(",");
    const byMessage = await env.DB.prepare(
      `SELECT t.id AS id FROM tickets t
       JOIN ticket_messages tm ON tm.ticket_id = t.id
       JOIN emails e ON e.id = tm.email_id
       WHERE e.message_id IN (${placeholders})
       ORDER BY t.id DESC LIMIT 1`
    )
      .bind(...ids)
      .first<{ id: number }>();
    if (byMessage?.id) return Number(byMessage.id);

    const byOrigin = await env.DB.prepare(
      `SELECT t.id AS id FROM tickets t
       JOIN emails e ON e.id = t.email_id
       WHERE e.message_id IN (${placeholders})
       ORDER BY t.id DESC LIMIT 1`
    )
      .bind(...ids)
      .first<{ id: number }>();
    if (byOrigin?.id) return Number(byOrigin.id);
  }

  const normalized = normalizeSubject(email.subject);
  if (normalized && contactId && isReplySubject(email.subject)) {
    const candidates = await env.DB.prepare("SELECT id, subject FROM tickets WHERE contact_id = ? ORDER BY id DESC LIMIT 20")
      .bind(contactId)
      .all<{ id: number; subject: string }>();
    for (const candidate of candidates.results || []) {
      if (normalizeSubject(String(candidate.subject)) === normalized) return Number(candidate.id);
    }
  }
  return null;
}

export async function addTicketMessage(
  env: Env,
  ticketId: number,
  body: string,
  authorType: "contact" | "agent" = "agent",
  options: { emailId?: number | null; internalNote?: boolean; reopen?: boolean } = {}
): Promise<void> {
  await ensureSchema(env);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO ticket_messages (ticket_id, email_id, author_type, body, internal_note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(ticketId, options.emailId ?? null, authorType, body || "", options.internalNote ? 1 : 0, now)
    .run();
  if (options.reopen) {
    await env.DB.prepare(
      "UPDATE tickets SET status = CASE WHEN status IN ('closed', 'resolved') THEN 'open' ELSE status END, updated_at = ? WHERE id = ?"
    )
      .bind(now, ticketId)
      .run();
  } else {
    await env.DB.prepare("UPDATE tickets SET updated_at = ? WHERE id = ?").bind(now, ticketId).run();
  }
}

export async function updateTicketFields(env: Env, ticketId: number, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  await ensureSchema(env);
  const allowed: Record<string, string> = { status: "status", priority: "priority", assigned_user: "assigned_user", subject: "subject" };
  const sets: string[] = [];
  const binds: unknown[] = [];
  for (const [key, column] of Object.entries(allowed)) {
    if (key in fields && fields[key] !== undefined) {
      sets.push(`${column} = ?`);
      binds.push(String(fields[key] ?? ""));
    }
  }
  if (!sets.length) return getTicket(env, ticketId);
  sets.push("updated_at = ?");
  binds.push(new Date().toISOString(), ticketId);
  await env.DB.prepare(`UPDATE tickets SET ${sets.join(", ")} WHERE id = ?`).bind(...binds).run();
  return getTicket(env, ticketId);
}

export async function searchAll(env: Env, query: string, limit = 20): Promise<Record<string, unknown>> {
  await ensureSchema(env);
  const cleaned = String(query || "").trim().slice(0, 120);
  if (!cleaned) return { query: "", emails: [], tickets: [], contacts: [] };
  const like = `%${cleaned.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
  const cap = Math.min(Math.max(limit, 1), 50);
  const [emails, tickets, contacts] = await Promise.all([
    env.DB.prepare(
      `SELECT id, message_id, from_email, to_email, subject, body_preview, status, received_at
       FROM emails
       WHERE subject LIKE ? ESCAPE '\\' OR from_email LIKE ? ESCAPE '\\' OR to_email LIKE ? ESCAPE '\\' OR body_preview LIKE ? ESCAPE '\\'
       ORDER BY received_at DESC LIMIT ?`
    )
      .bind(like, like, like, like, cap)
      .all<Record<string, unknown>>(),
    env.DB.prepare(
      `SELECT t.id, t.ticket_number, t.subject, t.status, t.priority, t.updated_at, c.email AS contact_email
       FROM tickets t LEFT JOIN contacts c ON c.id = t.contact_id
       WHERE t.ticket_number LIKE ? ESCAPE '\\' OR t.subject LIKE ? ESCAPE '\\' OR c.email LIKE ? ESCAPE '\\'
       ORDER BY t.updated_at DESC LIMIT ?`
    )
      .bind(like, like, like, cap)
      .all<Record<string, unknown>>(),
    env.DB.prepare(
      `SELECT id, name, email, company, total_emails, last_seen
       FROM contacts
       WHERE name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR company LIKE ? ESCAPE '\\'
       ORDER BY last_seen DESC LIMIT ?`
    )
      .bind(like, like, like, cap)
      .all<Record<string, unknown>>()
  ]);
  return {
    query: cleaned,
    emails: emails.results || [],
    tickets: tickets.results || [],
    contacts: contacts.results || []
  };
}

export async function createAttachmentRecords(env: Env, emailId: number, email: EmailInput): Promise<void> {
  await ensureSchema(env);
  for (const attachment of email.attachments || []) {
    let key: string | null = null;
    if (env.ATTACHMENTS && attachment.content) {
      key = `emails/${emailId}/${crypto.randomUUID()}-${attachment.filename}`;
      await env.ATTACHMENTS.put(key, attachment.content, {
        httpMetadata: { contentType: attachment.mimeType || "application/octet-stream" }
      });
    }
    await env.DB.prepare(
      `INSERT INTO attachments (email_id, filename, mime_type, size, r2_key, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(emailId, attachment.filename, attachment.mimeType, attachment.size, key, email.receivedAt)
      .run();
  }
}

export async function listOperationalEmails(env: Env, limit = 100): Promise<Record<string, unknown>[]> {
  await ensureSchema(env);
  const result = await env.DB.prepare(
    `SELECT emails.*, contacts.email AS contact_email, contacts.name AS contact_name
     FROM emails LEFT JOIN contacts ON contacts.id = emails.contact_id
     ORDER BY emails.received_at DESC LIMIT ?`
  )
    .bind(Math.min(limit, 250))
    .all<Record<string, unknown>>();
  return result.results || [];
}

export async function listContacts(env: Env): Promise<Record<string, unknown>[]> {
  await ensureSchema(env);
  const result = await env.DB.prepare("SELECT * FROM contacts ORDER BY last_seen DESC LIMIT 250").all<Record<string, unknown>>();
  return result.results || [];
}

export async function listTickets(env: Env): Promise<Record<string, unknown>[]> {
  await ensureSchema(env);
  const result = await env.DB.prepare(
    `SELECT tickets.*, contacts.email AS contact_email, contacts.name AS contact_name
     FROM tickets LEFT JOIN contacts ON contacts.id = tickets.contact_id
     ORDER BY tickets.updated_at DESC LIMIT 250`
  ).all<Record<string, unknown>>();
  return result.results || [];
}

export async function getTicket(env: Env, id: number): Promise<Record<string, unknown> | null> {
  await ensureSchema(env);
  const ticket = await env.DB.prepare(
    `SELECT tickets.*, contacts.email AS contact_email, contacts.name AS contact_name
     FROM tickets LEFT JOIN contacts ON contacts.id = tickets.contact_id WHERE tickets.id = ?`
  )
    .bind(id)
    .first<Record<string, unknown>>();
  if (!ticket) return null;
  const messages = await env.DB.prepare("SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC")
    .bind(id)
    .all<Record<string, unknown>>();
  return { ...ticket, messages: messages.results || [] };
}

export async function listInboxes(env: Env): Promise<Record<string, unknown>[]> {
  await ensureSchema(env);
  const result = await env.DB.prepare("SELECT * FROM inboxes ORDER BY priority ASC, name ASC").all<Record<string, unknown>>();
  return result.results || [];
}

export async function createInbox(env: Env, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  await ensureSchema(env);
  const now = new Date().toISOString();
  const emails = String(payload.email_addresses || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const result = await env.DB.prepare(
    `INSERT INTO inboxes (name, description, email_addresses_json, assigned_team, color, priority, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      String(payload.name || "Inbox"),
      String(payload.description || ""),
      JSON.stringify(emails),
      String(payload.assigned_team || ""),
      String(payload.color || "#2563eb"),
      Number(payload.priority || 100),
      String(payload.status || "active"),
      now,
      now
    )
    .run();
  return (await env.DB.prepare("SELECT * FROM inboxes WHERE id = ?").bind(result.meta.last_row_id).first<Record<string, unknown>>()) as Record<string, unknown>;
}

export async function listWorkflows(env: Env): Promise<Record<string, unknown>[]> {
  await ensureSchema(env);
  const result = await env.DB.prepare("SELECT * FROM workflows ORDER BY updated_at DESC").all<Record<string, unknown>>();
  return result.results || [];
}

export async function createWorkflow(env: Env, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  await ensureSchema(env);
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO workflows (name, active, trigger_type, conditions_json, actions_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      String(payload.name || "Workflow"),
      payload.active === false ? 0 : 1,
      String(payload.trigger_type || "new_email"),
      JSON.stringify(payload.conditions || {}),
      JSON.stringify(payload.actions || []),
      now,
      now
    )
    .run();
  return (await env.DB.prepare("SELECT * FROM workflows WHERE id = ?").bind(result.meta.last_row_id).first<Record<string, unknown>>()) as Record<string, unknown>;
}

export async function createWorkflowRun(
  env: Env,
  workflowId: number,
  emailId: number,
  status: string,
  actions: ActionResult[],
  error: string | null
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO workflow_runs (workflow_id, email_id, status, actions_json, error, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(workflowId, emailId, status, JSON.stringify(actions), error, new Date().toISOString())
    .run();
  await env.DB.prepare("UPDATE workflows SET last_run_at = ?, updated_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), new Date().toISOString(), workflowId)
    .run();
}

export async function listWorkflowRuns(env: Env): Promise<Record<string, unknown>[]> {
  await ensureSchema(env);
  const result = await env.DB.prepare(
    `SELECT workflow_runs.*, workflows.name AS workflow_name
     FROM workflow_runs JOIN workflows ON workflows.id = workflow_runs.workflow_id
     ORDER BY workflow_runs.created_at DESC LIMIT 250`
  ).all<Record<string, unknown>>();
  return result.results || [];
}

export async function listAttachments(env: Env): Promise<Record<string, unknown>[]> {
  await ensureSchema(env);
  const result = await env.DB.prepare(
    `SELECT attachments.*, emails.subject AS email_subject, emails.from_email
     FROM attachments JOIN emails ON emails.id = attachments.email_id
     ORDER BY attachments.created_at DESC LIMIT 250`
  ).all<Record<string, unknown>>();
  return result.results || [];
}

export async function listLogs(env: Env, filters: Record<string, string | undefined> = {}): Promise<Record<string, unknown>[]> {
  await ensureSchema(env);
  const clauses: string[] = [];
  const binds: string[] = [];
  if (filters.status) {
    clauses.push("status = ?");
    binds.push(filters.status);
  }
  if (filters.keyword) {
    clauses.push("(message LIKE ? OR metadata_json LIKE ?)");
    binds.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await env.DB.prepare(`SELECT * FROM logs ${where} ORDER BY created_at DESC LIMIT 250`)
    .bind(...binds)
    .all<Record<string, unknown>>();
  return result.results || [];
}

export async function listAIProviders(env: Env): Promise<Record<string, unknown>[]> {
  await ensureSchema(env);
  const result = await env.DB.prepare("SELECT id, provider, label, model, capabilities_json, active, created_at, updated_at FROM ai_providers ORDER BY provider ASC").all<Record<string, unknown>>();
  return result.results || [];
}

export async function createAIProvider(env: Env, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  await ensureSchema(env);
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO ai_providers (provider, label, model, credentials_json, capabilities_json, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      String(payload.provider || "openai"),
      String(payload.label || "AI Provider"),
      String(payload.model || "gpt-4.1-mini"),
      payload.api_key ? JSON.stringify({ api_key: "***masked***" }) : "{}",
      JSON.stringify(payload.capabilities || ["classification", "summary"]),
      payload.active === false ? 0 : 1,
      now,
      now
    )
    .run();
  return (await env.DB.prepare("SELECT id, provider, label, model, capabilities_json, active, created_at, updated_at FROM ai_providers WHERE id = ?").bind(result.meta.last_row_id).first<Record<string, unknown>>()) as Record<string, unknown>;
}

export async function getAnalytics(env: Env): Promise<Record<string, unknown>> {
  await ensureSchema(env);
  const [byDay, byInbox, tickets, workflows, domains, attachmentTypes] = await Promise.all([
    env.DB.prepare("SELECT substr(received_at, 1, 10) AS label, COUNT(*) AS value FROM emails GROUP BY label ORDER BY label DESC LIMIT 14").all(),
    env.DB.prepare("SELECT COALESCE(inboxes.name, 'Unassigned') AS label, COUNT(emails.id) AS value FROM emails LEFT JOIN inboxes ON inboxes.id = emails.inbox_id GROUP BY label ORDER BY value DESC LIMIT 10").all(),
    env.DB.prepare("SELECT substr(created_at, 1, 10) AS label, COUNT(*) AS value FROM tickets GROUP BY label ORDER BY label DESC LIMIT 14").all(),
    env.DB.prepare("SELECT workflows.name AS label, COUNT(workflow_runs.id) AS value FROM workflow_runs JOIN workflows ON workflows.id = workflow_runs.workflow_id GROUP BY workflows.id ORDER BY value DESC LIMIT 10").all(),
    env.DB.prepare("SELECT substr(COALESCE(contacts.email, emails.from_email), instr(COALESCE(contacts.email, emails.from_email), '@') + 1) AS label, COUNT(*) AS value FROM emails LEFT JOIN contacts ON contacts.id = emails.contact_id GROUP BY label ORDER BY value DESC LIMIT 10").all(),
    env.DB.prepare("SELECT mime_type AS label, COUNT(*) AS value FROM attachments GROUP BY mime_type ORDER BY value DESC LIMIT 10").all()
  ]);
  return {
    emailsPerDay: byDay.results || [],
    emailsByInbox: byInbox.results || [],
    ticketTrend: tickets.results || [],
    workflowActivity: workflows.results || [],
    topDomains: domains.results || [],
    attachmentTypes: attachmentTypes.results || []
  };
}
