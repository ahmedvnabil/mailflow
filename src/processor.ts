import PostalMime from "postal-mime";
import {
  addTicketMessage,
  createActionLog,
  createAttachmentRecords,
  createEmailEvent,
  findTicketForReply,
  getEmailEventByMessageId,
  getOperationalEmailByMessageId,
  createLogEntry,
  createOperationalEmail,
  createTicketForEmail,
  createWorkflowRun,
  getSettings,
  listRules,
  listWorkflows,
  touchRuleMatched,
  updateEmailEvent,
  updateOperationalEmailStatus,
  upsertContactFromEmail
} from "./db";
import { executeActions, matchRule } from "./rule-engine";
import { sanitizeHtmlEmail } from "./security";
import { productionSettingsFrom } from "./settings";
import type { ActionContext, ActionResult, EmailInput, Env, EventStatus, ProcessResult, RuleAction, RuleRecord } from "./types";

function headerMap(headers: Headers | Record<string, string> | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!headers) return result;
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result[key.toLowerCase()] = value;
    });
    return result;
  }
  for (const [key, value] of Object.entries(headers)) result[key.toLowerCase()] = String(value);
  return result;
}

function preview(body: string, length = 500): string {
  return body.replace(/\s+/g, " ").trim().slice(0, length);
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function eventStatus(actions: ActionResult[], matchedCount: number): EventStatus {
  if (matchedCount === 0 && actions.length === 0) return "no_match";
  if (actions.some((action) => action.status === "failed")) return "failed";
  if (actions.some((action) => action.actionType === "ignore" && action.status === "success")) return "ignored";
  return "success";
}

async function actionContext(env: Env): Promise<ActionContext> {
  const settings = await getSettings(env, true);
  return {
    telegramBotToken: env.TELEGRAM_BOT_TOKEN || settings.telegram_bot_token || undefined,
    telegramChatId: env.TELEGRAM_CHAT_ID || settings.telegram_chat_id || undefined,
    defaultForwardEmail: settings.default_forward_email || undefined,
    defaultWebhookUrl: settings.default_webhook_url || undefined,
    autoReplyEnabled: settings.auto_reply_enabled === "true",
    aiEnabled: settings.ai_enabled === "true",
    webhookRetriesCount: productionSettingsFrom(settings).workflowRetriesCount,
    openaiApiKey: env.OPENAI_API_KEY || settings.openai_api_key || undefined,
    openrouterApiKey: env.OPENROUTER_API_KEY || settings.openrouter_api_key || undefined,
    ollamaBaseUrl: env.OLLAMA_BASE_URL || settings.ollama_base_url || undefined,
    fetcher: fetch
  };
}

function defaultRule(settings: Record<string, string | null>): RuleRecord | null {
  const actions = [];
  if (settings.default_forward_email) actions.push({ type: "forward" as const, to: settings.default_forward_email });
  if (settings.default_webhook_url) actions.push({ type: "webhook" as const, url: settings.default_webhook_url, method: "POST" as const });
  if (!actions.length) return null;

  const now = new Date().toISOString();
  return {
    id: 0,
    name: "Default action",
    active: true,
    priority: 9999,
    matchMode: "all",
    conditions: {},
    actions,
    createdAt: now,
    updatedAt: now,
    lastMatchedAt: null
  };
}

export async function processEmail(env: Env, email: EmailInput): Promise<ProcessResult> {
  const rawSettings = await getSettings(env, true);
  const productionSettings = productionSettingsFrom(rawSettings);
  const existingEmail = await getOperationalEmailByMessageId(env, email.messageId);
  if (existingEmail) {
    const existingEvent = await getEmailEventByMessageId(env, email.messageId);
    await createLogEntry(env, "duplicate_email", "email", Number(existingEmail.id), "success", `Duplicate message ignored: ${email.messageId}`);
    return {
      event: existingEvent || {
        id: Number(existingEmail.legacy_event_id || 0),
        messageId: String(existingEmail.message_id),
        fromEmail: String(existingEmail.from_email),
        toEmail: String(existingEmail.to_email),
        subject: String(existingEmail.subject),
        bodyPreview: String(existingEmail.body_preview),
        hasAttachments: Boolean(existingEmail.attachments_json && String(existingEmail.attachments_json) !== "[]"),
        matchedRules: [],
        actions: [],
        status: "success",
        error: null,
        receivedAt: String(existingEmail.received_at)
      },
      matchedRules: [],
      actionResults: []
    };
  }

  const normalizedEmail: EmailInput = {
    ...email,
    bodyPreview: preview(email.body, productionSettings.maxStoredBodyPreviewLength),
    htmlBody: email.htmlBody ? sanitizeHtmlEmail(email.htmlBody) : "",
    attachments: (email.attachments || []).filter((attachment) => attachment.size <= productionSettings.maxAttachmentBytes),
    hasAttachments: (email.attachments || []).some((attachment) => attachment.size <= productionSettings.maxAttachmentBytes)
  };
  const event = await createEmailEvent(env, normalizedEmail, "no_match");
  const contact = await upsertContactFromEmail(env, normalizedEmail);
  const operationalEmail = await createOperationalEmail(env, normalizedEmail, event.id, Number(contact.id), "received");
  const operationalEmailId = Number(operationalEmail.id);
  await createAttachmentRecords(env, operationalEmailId, normalizedEmail);
  await createLogEntry(env, "email_received", "email", operationalEmailId, "success", `Email received from ${normalizedEmail.from}`, {
    to: normalizedEmail.to,
    subject: normalizedEmail.subject
  });

  // Threading: if this inbound message is a reply to an existing conversation,
  // attach it to that ticket instead of letting a rule open a duplicate one.
  let threadedTicketId: number | null = null;
  try {
    threadedTicketId = await findTicketForReply(env, normalizedEmail, Number(contact.id));
    if (threadedTicketId) {
      await addTicketMessage(env, threadedTicketId, normalizedEmail.bodyPreview, "contact", {
        emailId: operationalEmailId,
        reopen: true
      });
      await createLogEntry(env, "ticket_reply_received", "ticket", threadedTicketId, "success", "Inbound reply threaded onto existing ticket", {
        emailId: operationalEmailId
      });
    }
  } catch (error) {
    await createLogEntry(env, "ticket_thread_failed", "email", operationalEmailId, "failed", error instanceof Error ? error.message : "thread_lookup_failed");
  }
  const settings = rawSettings;
  const context = await actionContext(env);
  const matchedRules: RuleRecord[] = [];
  const actionResults: ActionResult[] = [];
  const tags = new Set<string>();
  let operationalStatus = "processed";
  let classification: string | undefined;

  try {
    const rules = await listRules(env, true);
    for (const rule of rules) {
      if (!matchRule(normalizedEmail, rule)) continue;
      matchedRules.push(rule);
      await touchRuleMatched(env, rule.id, normalizedEmail.receivedAt);
      const results = await executeActions(normalizedEmail, rule, context);
      actionResults.push(...results);
      for (const result of results) await createActionLog(env, event.id, rule.id, result);
      await applyProcessorSideEffects(env, operationalEmailId, Number(contact.id), normalizedEmail, rule.actions, productionSettings.autoTicketEnabled, productionSettings.defaultTicketPriority, threadedTicketId !== null);
    }

    if (matchedRules.length === 0) {
      const fallback = defaultRule(settings);
      if (fallback) {
        const results = await executeActions(normalizedEmail, fallback, context);
        actionResults.push(...results);
        for (const result of results) await createActionLog(env, event.id, null, result);
      }
    }

    for (const rule of matchedRules) {
      for (const action of rule.actions) {
        if (action.type === "tag_email") for (const tag of action.tags || []) tags.add(tag);
        if (action.type === "mark_spam") operationalStatus = "spam";
        if (action.type === "ignore") operationalStatus = "ignored";
        if (action.type === "ai_classify") classification = "needs_review";
      }
    }

    await runWorkflows(env, operationalEmailId, normalizedEmail, context, actionResults, productionSettings.workflowRetriesCount);

    const status = eventStatus(actionResults, matchedRules.length);
    const error = actionResults.find((result) => result.status === "failed")?.error || null;
    if (status === "failed") operationalStatus = "failed";
    await updateOperationalEmailStatus(env, operationalEmailId, operationalStatus, [...tags], classification);
    await createLogEntry(env, "email_processed", "email", operationalEmailId, status, `Email processed with ${matchedRules.length} matching rule(s)`, {
      matchedRules: matchedRules.map((rule) => rule.name),
      actionCount: actionResults.length
    });
    const updated = await updateEmailEvent(
      env,
      event.id,
      status,
      matchedRules.map((rule) => ({ id: rule.id, name: rule.name })),
      actionResults,
      error
    );
    return { event: updated, matchedRules, actionResults };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email processing failed";
    await updateOperationalEmailStatus(env, operationalEmailId, "failed");
    await createLogEntry(env, "email_failed", "email", operationalEmailId, "failed", message);
    const updated = await updateEmailEvent(env, event.id, "failed", [], actionResults, message);
    return { event: updated, matchedRules, actionResults };
  }
}

async function applyProcessorSideEffects(
  env: Env,
  emailId: number,
  contactId: number,
  email: EmailInput,
  actions: RuleAction[],
  autoTicketEnabled: boolean,
  defaultTicketPriority: "low" | "normal" | "high" | "urgent",
  alreadyThreaded = false
): Promise<void> {
  for (const action of actions) {
    if (action.type === "create_ticket" && autoTicketEnabled && !alreadyThreaded) {
      const ticket = await createTicketForEmail(env, emailId, contactId, email.subject || "New email", action.priority || defaultTicketPriority, action.assignedUser || "");
      await createLogEntry(env, "ticket_created", "ticket", Number(ticket.id), "success", `Ticket ${ticket.ticket_number} created from email`, {
        emailId
      });
    }
    if (action.type === "create_contact" || action.type === "update_contact") {
      await createLogEntry(env, "contact_updated", "contact", contactId, "success", `Contact updated from email ${email.messageId}`);
    }
    if (action.type === "store_attachment") {
      await createLogEntry(env, "attachments_stored", "email", emailId, "success", `${email.attachments?.length || 0} attachment(s) stored or indexed`);
    }
  }
}

async function runWorkflows(
  env: Env,
  emailId: number,
  email: EmailInput,
  context: ActionContext,
  aggregateResults: ActionResult[],
  retriesCount: number
): Promise<void> {
  const workflows = await listWorkflows(env);
  for (const workflow of workflows) {
    if (Number(workflow.active) !== 1) continue;
    const trigger = String(workflow.trigger_type || "new_email");
    const conditions = parseJson<Record<string, unknown>>(workflow.conditions_json, {});
    const keywords = Array.isArray(conditions.keywords) ? conditions.keywords.map(String) : [];
    const keywordMatch = keywords.length === 0 || keywords.some((keyword) => `${email.subject}\n${email.body}`.toLowerCase().includes(keyword.toLowerCase()));
    if (trigger !== "new_email" && trigger !== "keyword_match" && trigger !== "attachment_received") continue;
    if (trigger === "keyword_match" && !keywordMatch) continue;
    if (trigger === "attachment_received" && !email.hasAttachments) continue;

    const workflowRule: RuleRecord = {
      id: Number(workflow.id),
      name: String(workflow.name),
      active: true,
      priority: 0,
      matchMode: "all",
      conditions: {},
      actions: parseJson<RuleAction[]>(workflow.actions_json, []),
      createdAt: String(workflow.created_at),
      updatedAt: String(workflow.updated_at),
      lastMatchedAt: workflow.last_run_at ? String(workflow.last_run_at) : null
    };
    let results: ActionResult[] = [];
    let failed: ActionResult | undefined;
    for (let attempt = 0; attempt <= retriesCount; attempt++) {
      results = await executeActions(email, workflowRule, context);
      failed = results.find((result) => result.status === "failed");
      if (!failed) break;
    }
    aggregateResults.push(...results);
    await createWorkflowRun(env, Number(workflow.id), emailId, failed ? "failed" : "success", results, failed?.error || null);
    await createLogEntry(env, "workflow_run", "workflow", Number(workflow.id), failed ? "failed" : "success", `Workflow ${workflow.name} executed`, {
      emailId,
      actionCount: results.length
    });
  }
}

export function emailFromSimulation(payload: Record<string, unknown>): EmailInput {
  const body = String(payload.body || "");
  const headers = headerMap(payload.headers as Record<string, string> | undefined);
  return {
    messageId: String(payload.messageId || `sim-${crypto.randomUUID()}`),
    from: String(payload.from || ""),
    to: String(payload.to || ""),
    subject: String(payload.subject || ""),
    body,
    htmlBody: String(payload.htmlBody || ""),
    bodyPreview: preview(body),
    inReplyTo: String(payload.inReplyTo || headers["in-reply-to"] || ""),
    references: String(payload.references || headers["references"] || ""),
    hasAttachments: Boolean(payload.hasAttachments),
    attachments: [],
    headers,
    receivedAt: new Date().toISOString()
  };
}

export async function emailFromCloudflare(message: ForwardableEmailMessage): Promise<EmailInput> {
  const parsed = await PostalMime.parse(message.raw);
  const body = parsed.text || parsed.html || "";
  const addressList = (items: Array<{ address?: string }> | undefined) => (items || []).map((item) => item.address).filter(Boolean).join(", ");
  const headers = headerMap(message.headers);
  return {
    messageId: parsed.messageId || message.headers.get("message-id") || crypto.randomUUID(),
    from: message.from,
    to: message.to,
    cc: addressList(parsed.cc),
    bcc: addressList(parsed.bcc),
    replyTo: addressList(parsed.replyTo),
    inReplyTo: parsed.inReplyTo || message.headers.get("in-reply-to") || "",
    references: (Array.isArray(parsed.references) ? parsed.references.join(" ") : parsed.references) || message.headers.get("references") || "",
    subject: parsed.subject || message.headers.get("subject") || "",
    body,
    htmlBody: parsed.html ? sanitizeHtmlEmail(parsed.html) : "",
    bodyPreview: preview(body),
    hasAttachments: Boolean(parsed.attachments?.length),
    attachments: (parsed.attachments || []).map((attachment) => {
      const content: ArrayBuffer | undefined =
        attachment.content instanceof ArrayBuffer
          ? attachment.content
          : attachment.content instanceof Uint8Array
            ? new Uint8Array(attachment.content).buffer
            : undefined;
      return {
        filename: attachment.filename || "attachment",
        mimeType: attachment.mimeType || "application/octet-stream",
        size: content?.byteLength || (typeof attachment.content === "string" ? attachment.content.length : 0),
        content
      };
    }),
    headers,
    receivedAt: new Date().toISOString(),
    rawMessage: message
  };
}
