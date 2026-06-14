import type {
  ActionContext,
  ActionResult,
  EmailInput,
  RuleAction,
  RuleConditions,
  RuleRecord
} from "./types";
import { safeOutboundUrl } from "./security";

function normalize(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function includes(haystack: unknown, needle: unknown): boolean {
  const normalizedNeedle = normalize(needle);
  if (!normalizedNeedle) return false;
  return normalize(haystack).includes(normalizedNeedle);
}

function equals(left: unknown, right: unknown): boolean {
  const normalizedRight = normalize(right);
  if (!normalizedRight) return false;
  return normalize(left) === normalizedRight;
}

function conditionChecks(email: EmailInput, conditions: RuleConditions): boolean[] {
  const checks: boolean[] = [];

  if (conditions.recipient_equals) checks.push(equals(email.to, conditions.recipient_equals));
  if (conditions.recipient_contains) checks.push(includes(email.to, conditions.recipient_contains));
  if (conditions.sender_equals) checks.push(equals(email.from, conditions.sender_equals));
  if (conditions.sender_contains) checks.push(includes(email.from, conditions.sender_contains));
  if (conditions.subject_contains) checks.push(includes(email.subject, conditions.subject_contains));
  if (conditions.body_contains) checks.push(includes(email.body, conditions.body_contains));
  if (typeof conditions.has_attachment === "boolean") {
    checks.push(email.hasAttachments === conditions.has_attachment);
  }
  if (conditions.header_contains?.name && conditions.header_contains?.value) {
    const value = email.headers[conditions.header_contains.name.toLowerCase()];
    checks.push(includes(value, conditions.header_contains.value));
  }
  if (conditions.keywords?.length) {
    const bodyAndSubject = `${email.subject}\n${email.body}`;
    checks.push(conditions.keywords.some((keyword) => includes(bodyAndSubject, keyword)));
  }
  if (conditions.domain_matches) {
    const domain = normalize(email.from.split("@").pop());
    checks.push(domain === normalize(conditions.domain_matches));
  }
  if (conditions.regex) {
    try {
      const pattern = new RegExp(conditions.regex, "i");
      checks.push(pattern.test(`${email.from}\n${email.to}\n${email.subject}\n${email.body}`));
    } catch {
      checks.push(false);
    }
  }

  return checks;
}

export function matchRule(email: EmailInput, rule: RuleRecord): boolean {
  if (!rule.active) return false;

  const checks = conditionChecks(email, rule.conditions);
  if (checks.length === 0) return true;
  return rule.matchMode === "any" ? checks.some(Boolean) : checks.every(Boolean);
}

function renderTemplate(template: string | undefined, email: EmailInput, rule: RuleRecord): string {
  const source = template || "New email from {{from}}: {{subject}}";
  const replacements: Record<string, string> = {
    from: email.from,
    to: email.to,
    subject: email.subject,
    body_preview: email.bodyPreview,
    rule: rule.name,
    received_at: email.receivedAt
  };

  return source.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (_, key: string) => {
    return replacements[key] ?? "";
  });
}

async function fetchWithRetries(fetcher: typeof fetch, input: RequestInfo | URL, init: RequestInit, retries = 0): Promise<Response> {
  let response: Response | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    response = await fetcher(input, init);
    if (response.ok || response.status < 500) return response;
  }
  return response as Response;
}

async function executeAIAction(
  actionType: "ai_classify" | "ai_summarize" | "ai_extract_fields",
  email: EmailInput,
  context: ActionContext,
  provider = "openai"
): Promise<ActionResult> {
  if (!context.aiEnabled) {
    return { actionType, status: "failed", error: "AI automation is disabled" };
  }
  const fetcher = context.fetcher || fetch;
  const prompts = {
    ai_classify: "Classify this email by intent, urgency, sentiment, and likely department. Return compact JSON.",
    ai_summarize: "Summarize this email in two sentences and identify the next best action.",
    ai_extract_fields: "Extract names, companies, invoice references, phone numbers, dates, and requested actions as compact JSON."
  };
  const content = `${prompts[actionType]}\n\nFrom: ${email.from}\nTo: ${email.to}\nSubject: ${email.subject}\nBody:\n${email.bodyPreview}`;

  if (provider === "ollama") {
    const baseUrl = context.ollamaBaseUrl || "http://localhost:11434";
    const response = await fetcher(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: "llama3.1", messages: [{ role: "user", content }], stream: false })
    });
    return {
      actionType,
      status: response.ok ? "success" : "failed",
      responsePreview: `Ollama status ${response.status}`,
      error: response.ok ? undefined : `Ollama returned ${response.status}`
    };
  }

  const isOpenRouter = provider === "openrouter";
  const apiKey = isOpenRouter ? context.openrouterApiKey : context.openaiApiKey;
  if (!apiKey) {
    return { actionType, status: "failed", error: `${provider} API key is not configured` };
  }

  const response = await fetcher(isOpenRouter ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: isOpenRouter ? "openai/gpt-4.1-mini" : "gpt-4.1-mini",
      messages: [{ role: "user", content }],
      temperature: 0.1
    })
  });

  return {
    actionType,
    status: response.ok ? "success" : "failed",
    responsePreview: `${provider} status ${response.status}`,
    error: response.ok ? undefined : `${provider} returned ${response.status}`
  };
}

async function executeOneAction(
  action: RuleAction,
  email: EmailInput,
  rule: RuleRecord,
  context: ActionContext
): Promise<ActionResult> {
  const fetcher = context.fetcher || fetch;

  if (action.type === "save") {
    return { actionType: "save", status: "success", responsePreview: "Email event stored" };
  }

  if (action.type === "ignore") {
    return { actionType: "ignore", status: "success", responsePreview: "Email marked ignored" };
  }

  if (action.type === "forward") {
    const destination = action.to || context.defaultForwardEmail;
    if (!destination) {
      return { actionType: "forward", status: "failed", error: "Forward destination is not configured" };
    }
    const rawMessage = email.rawMessage as (ForwardableEmailMessage & { canBeForwarded?: boolean }) | undefined;
    if (!rawMessage?.forward || rawMessage.canBeForwarded === false) {
      return {
        actionType: "forward",
        status: "skipped",
        responsePreview: `Would forward to ${destination}`
      };
    }
    await rawMessage.forward(destination);
    return { actionType: "forward", status: "success", responsePreview: `Forwarded to ${destination}` };
  }

  if (action.type === "telegram") {
    if (!context.telegramBotToken || !context.telegramChatId) {
      return {
        actionType: "telegram",
        status: "failed",
        error: "Telegram token or chat ID is not configured"
      };
    }
    const response = await fetchWithRetries(fetcher,
      `https://api.telegram.org/bot${context.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: context.telegramChatId,
          text: renderTemplate(action.template, email, rule)
        })
      },
      context.webhookRetriesCount || 0
    );
    return {
      actionType: "telegram",
      status: response.ok ? "success" : "failed",
      responsePreview: `Telegram API status ${response.status}`,
      error: response.ok ? undefined : `Telegram API returned ${response.status}`
    };
  }

  if (action.type === "slack") {
    const url = safeOutboundUrl(action.webhookUrl);
    if (!url.ok) return { actionType: "slack", status: "failed", error: `Slack webhook blocked: ${url.reason}` };
    const response = await fetchWithRetries(fetcher, url.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: renderTemplate(action.template, email, rule) })
    }, context.webhookRetriesCount || 0);
    return {
      actionType: "slack",
      status: response.ok ? "success" : "failed",
      responsePreview: `Slack webhook status ${response.status}`,
      error: response.ok ? undefined : `Slack webhook returned ${response.status}`
    };
  }

  if (action.type === "webhook") {
    const url = safeOutboundUrl(action.url || context.defaultWebhookUrl);
    if (!url.ok) return { actionType: "webhook", status: "failed", error: `Webhook blocked: ${url.reason}` };

    const response = await fetchWithRetries(fetcher, url.url, {
      method: action.method || "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message_id: email.messageId,
        from: email.from,
        to: email.to,
        subject: email.subject,
        body_preview: email.bodyPreview,
        matched_rule: rule.name,
        received_at: email.receivedAt
      })
    }, context.webhookRetriesCount || 0);

    return {
      actionType: "webhook",
      status: response.ok ? "success" : "failed",
      responsePreview: `Webhook status ${response.status}`,
      error: response.ok ? undefined : `Webhook returned ${response.status}`
    };
  }

  if (action.type === "api_call") {
    const url = safeOutboundUrl(action.url);
    if (!url.ok) return { actionType: "api_call", status: "failed", error: `API URL blocked: ${url.reason}` };
    const response = await fetchWithRetries(fetcher, url.url, {
      method: action.method || "POST",
      headers: { "content-type": "application/json" },
      body: action.bodyTemplate ? renderTemplate(action.bodyTemplate, email, rule) : JSON.stringify({ email, rule: rule.name })
    }, context.webhookRetriesCount || 0);
    return {
      actionType: "api_call",
      status: response.ok ? "success" : "failed",
      responsePreview: `API status ${response.status}`,
      error: response.ok ? undefined : `API returned ${response.status}`
    };
  }

  if (
    action.type === "move_to_inbox" ||
    action.type === "create_ticket" ||
    action.type === "store_attachment" ||
    action.type === "tag_email" ||
    action.type === "assign_user" ||
    action.type === "create_contact" ||
    action.type === "update_contact" ||
    action.type === "mark_spam"
  ) {
    return {
      actionType: action.type,
      status: "success",
      responsePreview: `${action.type} queued in MailFlow processor`
    };
  }

  if (action.type === "auto_reply") {
    if (!context.autoReplyEnabled) {
      return { actionType: "auto_reply", status: "skipped", responsePreview: "Auto-reply is disabled" };
    }
    return {
      actionType: "auto_reply",
      status: "skipped",
      responsePreview: "Auto-reply requires a configured outbound email provider or Cloudflare send binding"
    };
  }

  if (action.type === "ai_classify" || action.type === "ai_summarize" || action.type === "ai_extract_fields") {
    return executeAIAction(action.type, email, context, action.provider || "openai");
  }

  const unknownAction = action as RuleAction;
  return { actionType: unknownAction.type, status: "skipped", responsePreview: "Unknown action" };
}

export async function executeActions(
  email: EmailInput,
  rule: RuleRecord,
  context: ActionContext
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  for (const action of rule.actions) {
    try {
      results.push(await executeOneAction(action, email, rule, context));
    } catch (error) {
      results.push({
        actionType: action.type,
        status: "failed",
        error: error instanceof Error ? error.message : "Action failed"
      });
    }
  }

  return results;
}
