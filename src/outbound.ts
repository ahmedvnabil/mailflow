import { ensureSchema, getSettings } from "./db";
import { redactSecrets } from "./security";
import type { Env, OutboundEmailLogRecord, OutboundEmailTemplateRecord, OutboundSuppressionRecord } from "./types";

const PROVIDER = "cloudflare_email";
const DEFAULT_ALLOWED_SENDERS = ["support@yourdomain.com", "noreply@yourdomain.com", "noreply@example.com", "support@example.com"];
const MAX_SUBJECT_LENGTH = 998;
const MAX_TEXT_BODY_LENGTH = 100_000;
const MAX_HTML_BODY_LENGTH = 250_000;

export interface OutboundEmailPayload {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template_id?: number | null;
  data?: Record<string, unknown>;
  inReplyTo?: string;
  references?: string;
}

export interface OutboundSettings {
  outboundEnabled: boolean;
  defaultFromEmail: string;
  allowedSenderAddresses: string[];
  maxRecipientsPerRequest: number;
  dailySendLimit: number;
  requireVerifiedSenderWarning: boolean;
}

export interface SendOutboundOptions {
  apiKeyId?: string;
  settings?: OutboundSettings;
}

export type SendOutboundResult =
  | { ok: true; status: "sent"; logId: number; recipients: string[] }
  | { ok: false; error: string; logId?: number; status?: "failed" };

function parseList(value: string | null | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim().toLowerCase()).filter(Boolean);
  } catch {
    // Comma-delimited settings are supported for easy dashboard editing.
  }
  const items = value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return items.length ? items : fallback;
}

function boolSetting(value: string | null | undefined, fallback: boolean): boolean {
  if (value === undefined || value === null || value === "") return fallback;
  return value === "true" || value === "1" || value === "yes";
}

function numberSetting(value: string | null | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

export async function getOutboundSettings(env: Env): Promise<OutboundSettings> {
  const settings = await getSettings(env, true);
  const defaultFromEmail = settings.default_from_email || DEFAULT_ALLOWED_SENDERS[0];
  return {
    outboundEnabled: boolSetting(settings.outbound_enabled, true),
    defaultFromEmail,
    allowedSenderAddresses: parseList(settings.allowed_sender_addresses, DEFAULT_ALLOWED_SENDERS),
    maxRecipientsPerRequest: numberSetting(settings.max_recipients_per_request, 10, 1, 50),
    dailySendLimit: numberSetting(settings.daily_send_limit, 500, 1, 100_000),
    requireVerifiedSenderWarning: boolSetting(settings.require_verified_sender_warning, true)
  };
}

function isValidEmailAddress(value: string): boolean {
  return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(value.trim());
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function recipientsFrom(value: string | string[]): string[] {
  const raw = Array.isArray(value) ? value : value.split(",");
  return raw.map((item) => item.trim()).filter(Boolean);
}

function normalizeTemplatePayload(payload: Record<string, unknown>): Omit<OutboundEmailTemplateRecord, "id" | "created_at" | "updated_at"> {
  const variables = Array.isArray(payload.variables_json)
    ? payload.variables_json
    : parseList(String(payload.variables_json || ""), []);
  return {
    name: String(payload.name || "Untitled template").trim().slice(0, 120),
    subject: String(payload.subject || "").trim().slice(0, MAX_SUBJECT_LENGTH),
    text_body: String(payload.text_body || "").slice(0, MAX_TEXT_BODY_LENGTH),
    html_body: String(payload.html_body || "").slice(0, MAX_HTML_BODY_LENGTH),
    variables_json: JSON.stringify(variables),
    active: payload.active !== false && payload.active !== "false"
  };
}

function mapTemplate(row: Record<string, unknown>): OutboundEmailTemplateRecord {
  return {
    id: Number(row.id),
    name: String(row.name),
    subject: String(row.subject),
    text_body: String(row.text_body || ""),
    html_body: String(row.html_body || ""),
    variables_json: String(row.variables_json || "[]"),
    active: Number(row.active) === 1,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

function mapLog(row: Record<string, unknown>): OutboundEmailLogRecord {
  return {
    id: Number(row.id),
    from_email: String(row.from_email),
    to_email: String(row.to_email),
    subject: String(row.subject),
    template_id: row.template_id === null || row.template_id === undefined ? null : Number(row.template_id),
    status: String(row.status),
    provider: String(row.provider),
    error: row.error ? String(row.error) : null,
    metadata_json: String(row.metadata_json || "{}"),
    sent_at: row.sent_at ? String(row.sent_at) : null,
    created_at: String(row.created_at)
  };
}

function mapSuppression(row: Record<string, unknown>): OutboundSuppressionRecord {
  return {
    id: Number(row.id),
    email: String(row.email),
    reason: String(row.reason || ""),
    source: String(row.source || "manual"),
    active: Number(row.active) === 1,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

export async function listOutboundTemplates(env: Env): Promise<OutboundEmailTemplateRecord[]> {
  await ensureSchema(env);
  const result = await env.DB.prepare("SELECT * FROM outbound_email_templates ORDER BY updated_at DESC, id DESC").all<Record<string, unknown>>();
  return (result.results || []).map(mapTemplate);
}

export async function getOutboundTemplate(env: Env, id: number): Promise<OutboundEmailTemplateRecord | null> {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT * FROM outbound_email_templates WHERE id = ?").bind(id).first<Record<string, unknown>>();
  return row ? mapTemplate(row) : null;
}

export async function createOutboundTemplate(env: Env, payload: Record<string, unknown>): Promise<OutboundEmailTemplateRecord> {
  await ensureSchema(env);
  const template = normalizeTemplatePayload(payload);
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO outbound_email_templates (name, subject, text_body, html_body, variables_json, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(template.name, template.subject, template.text_body, template.html_body, template.variables_json, template.active ? 1 : 0, now, now)
    .run();
  return (await getOutboundTemplate(env, Number(result.meta.last_row_id))) as OutboundEmailTemplateRecord;
}

export async function updateOutboundTemplate(env: Env, id: number, payload: Record<string, unknown>): Promise<OutboundEmailTemplateRecord | null> {
  const existing = await getOutboundTemplate(env, id);
  if (!existing) return null;
  const template = normalizeTemplatePayload({ ...existing, ...payload });
  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE outbound_email_templates
     SET name = ?, subject = ?, text_body = ?, html_body = ?, variables_json = ?, active = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(template.name, template.subject, template.text_body, template.html_body, template.variables_json, template.active ? 1 : 0, now, id)
    .run();
  return getOutboundTemplate(env, id);
}

export async function deleteOutboundTemplate(env: Env, id: number): Promise<boolean> {
  await ensureSchema(env);
  const result = await env.DB.prepare("DELETE FROM outbound_email_templates WHERE id = ?").bind(id).run();
  return result.meta.changes > 0;
}

export async function listOutboundLogs(env: Env, limit = 100): Promise<OutboundEmailLogRecord[]> {
  await ensureSchema(env);
  const result = await env.DB.prepare("SELECT * FROM outbound_email_logs ORDER BY created_at DESC, id DESC LIMIT ?")
    .bind(Math.min(Math.max(limit, 1), 250))
    .all<Record<string, unknown>>();
  return (result.results || []).map(mapLog);
}

export async function listOutboundSuppressions(env: Env, activeOnly = true): Promise<OutboundSuppressionRecord[]> {
  await ensureSchema(env);
  const result = await env.DB.prepare(
    `SELECT * FROM outbound_suppressions
     ${activeOnly ? "WHERE active = 1" : ""}
     ORDER BY updated_at DESC, id DESC`
  ).all<Record<string, unknown>>();
  return (result.results || []).map(mapSuppression);
}

export async function createOutboundSuppression(env: Env, payload: Record<string, unknown>): Promise<OutboundSuppressionRecord> {
  await ensureSchema(env);
  const email = normalizeEmail(String(payload.email || ""));
  if (!isValidEmailAddress(email)) throw new Error("invalid_suppression_email");
  const reason = String(payload.reason || "manual block").trim().slice(0, 500);
  const source = String(payload.source || "manual").trim().slice(0, 80) || "manual";
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO outbound_suppressions (email, reason, source, active, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?)
     ON CONFLICT(email) DO UPDATE SET reason = excluded.reason, source = excluded.source, active = 1, updated_at = excluded.updated_at`
  )
    .bind(email, reason, source, now, now)
    .run();
  const row = await env.DB.prepare("SELECT * FROM outbound_suppressions WHERE email = ?").bind(email).first<Record<string, unknown>>();
  return mapSuppression(row as Record<string, unknown>);
}

export async function removeOutboundSuppression(env: Env, id: number): Promise<boolean> {
  await ensureSchema(env);
  const result = await env.DB.prepare("UPDATE outbound_suppressions SET active = 0, updated_at = ? WHERE id = ? AND active = 1")
    .bind(new Date().toISOString(), id)
    .run();
  return result.meta.changes > 0;
}

async function isRecipientSuppressed(env: Env, recipient: string): Promise<boolean> {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT id FROM outbound_suppressions WHERE email = ? AND active = 1")
    .bind(normalizeEmail(recipient))
    .first<{ id: number }>();
  return Boolean(row);
}

async function createOutboundLog(
  env: Env,
  payload: {
    from: string;
    to: string;
    subject: string;
    templateId?: number | null;
    status: string;
    error?: string | null;
    metadata?: Record<string, unknown>;
    sentAt?: string | null;
  }
): Promise<OutboundEmailLogRecord> {
  await ensureSchema(env);
  const createdAt = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO outbound_email_logs
     (from_email, to_email, subject, template_id, status, provider, error, metadata_json, sent_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      payload.from,
      payload.to,
      payload.subject,
      payload.templateId || null,
      payload.status,
      PROVIDER,
      payload.error ? redactSecrets(payload.error) : null,
      redactSecrets(payload.metadata || {}),
      payload.sentAt || null,
      createdAt
    )
    .run();
  const row = await env.DB.prepare("SELECT * FROM outbound_email_logs WHERE id = ?").bind(result.meta.last_row_id).first<Record<string, unknown>>();
  return mapLog(row as Record<string, unknown>);
}

function renderText(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, key: string) => {
    const value = key.split(".").reduce<unknown>((acc, part) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined), data);
    return value === undefined || value === null ? "" : String(value);
  });
}

export async function renderOutboundTemplate(
  env: Env,
  id: number,
  data: Record<string, unknown> = {}
): Promise<{ subject: string; text: string; html: string } | null> {
  const template = await getOutboundTemplate(env, id);
  if (!template || !template.active) return null;
  return {
    subject: renderText(template.subject, data),
    text: renderText(template.text_body, data),
    html: renderText(template.html_body, data)
  };
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function limitExceeded(env: Env, day: string, apiKeyId: string, recipient: string, dailyLimit: number): Promise<string | null> {
  await ensureSchema(env);
  const recipientHash = await sha256(recipient);
  const [apiUsage, recipientUsage] = await Promise.all([
    env.DB.prepare("SELECT COALESCE(SUM(count), 0) AS count FROM outbound_daily_usage WHERE day = ? AND api_key_id = ?")
      .bind(day, apiKeyId)
      .first<{ count: number }>(),
    env.DB.prepare("SELECT count FROM outbound_daily_usage WHERE day = ? AND api_key_id = ? AND recipient_hash = ?")
      .bind(day, apiKeyId, recipientHash)
      .first<{ count: number }>()
  ]);
  if (Number(apiUsage?.count || 0) >= dailyLimit) return "daily_send_limit_exceeded";
  if (Number(recipientUsage?.count || 0) >= dailyLimit) return "recipient_daily_limit_exceeded";
  return null;
}

async function incrementUsage(env: Env, day: string, apiKeyId: string, recipient: string): Promise<void> {
  const recipientHash = await sha256(recipient);
  await env.DB.prepare(
    `INSERT INTO outbound_daily_usage (day, api_key_id, recipient_hash, count)
     VALUES (?, ?, ?, 1)
     ON CONFLICT(day, api_key_id, recipient_hash) DO UPDATE SET count = count + 1`
  )
    .bind(day, apiKeyId, recipientHash)
    .run();
}

function wrapMessageId(value: string | undefined): string {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return /^<.*>$/.test(trimmed) ? trimmed : `<${trimmed.replace(/^<|>$/g, "")}>`;
}

function threadingHeaderLines(message: Record<string, unknown>): string[] {
  const lines: string[] = [];
  const inReplyTo = wrapMessageId(message.inReplyTo as string | undefined);
  if (inReplyTo) {
    lines.push(`In-Reply-To: ${inReplyTo}`);
    const references = String(message.references || "").trim() || inReplyTo;
    lines.push(`References: ${references}`);
  }
  return lines;
}

async function sendWithBinding(env: Env, message: Record<string, unknown>): Promise<void> {
  if (!env.EMAIL) throw new Error("email_binding_not_configured");
  try {
    await env.EMAIL.send(message);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    if (!messageText.toLowerCase().includes("emailmessage")) throw error;
    const { EmailMessage } = (await import("cloudflare:email")) as { EmailMessage: new (from: string, to: string, raw: string) => unknown };
    const fromDomain = String(message.from || "").split("@")[1] || "mailflow.local";
    const raw = [
      `From: ${message.from}`,
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      `Message-ID: <mfs-${crypto.randomUUID()}@${fromDomain}>`,
      ...threadingHeaderLines(message),
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "",
      String(message.html || message.text || "")
    ].join("\r\n");
    await env.EMAIL.send(new EmailMessage(String(message.from), String(message.to), raw));
  }
}

export async function sendOutboundEmail(
  env: Env,
  payload: OutboundEmailPayload,
  options: SendOutboundOptions = {}
): Promise<SendOutboundResult> {
  const settings = options.settings || (await getOutboundSettings(env));
  const from = normalizeEmail(String(payload.from || settings.defaultFromEmail));
  const recipients = recipientsFrom(payload.to).map(normalizeEmail);
  let subject = String(payload.subject || "");
  let text = String(payload.text || "");
  let html = String(payload.html || "");
  const templateId = payload.template_id ? Number(payload.template_id) : null;

  if (templateId) {
    const rendered = await renderOutboundTemplate(env, templateId, payload.data || {});
    if (!rendered) {
      const log = await createOutboundLog(env, { from, to: recipients.join(","), subject, templateId, status: "failed", error: "template_not_found_or_inactive" });
      return { ok: false, error: "template_not_found_or_inactive", logId: log.id, status: "failed" };
    }
    subject = subject || rendered.subject;
    text = text || rendered.text;
    html = html || rendered.html;
  }

  const fail = async (error: string): Promise<SendOutboundResult> => {
    const log = await createOutboundLog(env, { from, to: recipients.join(","), subject, templateId, status: "failed", error });
    return { ok: false, error, logId: log.id, status: "failed" };
  };

  if (!settings.outboundEnabled) return fail("outbound_disabled");
  if (!isValidEmailAddress(from) || !settings.allowedSenderAddresses.map(normalizeEmail).includes(from)) return fail("sender_not_allowed");
  if (!recipients.length || recipients.some((recipient) => !isValidEmailAddress(recipient))) return fail("invalid_recipient");
  if (recipients.length > settings.maxRecipientsPerRequest) return fail("too_many_recipients");
  for (const recipient of recipients) {
    if (await isRecipientSuppressed(env, recipient)) return fail("recipient_suppressed");
  }
  if (!subject || subject.length > MAX_SUBJECT_LENGTH) return fail("invalid_subject");
  if (text.length > MAX_TEXT_BODY_LENGTH || html.length > MAX_HTML_BODY_LENGTH) return fail("body_too_large");
  if (!text && !html) return fail("empty_body");
  if (!env.EMAIL) return fail("email_binding_not_configured");

  const day = new Date().toISOString().slice(0, 10);
  const apiKeyId = options.apiKeyId || "admin";
  for (const recipient of recipients) {
    const limitReason = await limitExceeded(env, day, apiKeyId, recipient, settings.dailySendLimit);
    if (limitReason) return fail(limitReason);
  }

  try {
    for (const recipient of recipients) {
      await sendWithBinding(env, { from, to: recipient, subject, text, html, inReplyTo: payload.inReplyTo, references: payload.references });
      await incrementUsage(env, day, apiKeyId, recipient);
    }
    const sentAt = new Date().toISOString();
    const log = await createOutboundLog(env, {
      from,
      to: recipients.join(","),
      subject,
      templateId,
      status: "sent",
      sentAt,
      metadata: { recipients: recipients.length }
    });
    return { ok: true, status: "sent", logId: log.id, recipients };
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
