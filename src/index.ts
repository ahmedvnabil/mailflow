import { Hono, type Context } from "hono";
import { adminKey, bodySizeLimit, clearSessionCookie, isAuthorized, makeSessionCookie, rateLimit, requireAuth, sessionValue } from "./auth";
import { redactSecrets, timingSafeEqualString } from "./security";
import {
  addTicketMessage,
  createRule,
  createAIProvider,
  createInbox,
  createWorkflow,
  deleteRule,
  getAnalytics,
  getEmailEvent,
  getOperationalEmail,
  getRule,
  getStats,
  getTicket,
  listAIProviders,
  listAttachments,
  listContacts,
  listInboxes,
  listLogs,
  listOperationalEmails,
  listEmailEvents,
  listRules,
  listSettings,
  listTickets,
  listWorkflowRuns,
  listWorkflows,
  searchAll,
  updateRule,
  updateOperationalEmailStatus,
  updateTicketFields,
  updateSettings
} from "./db";
import {
  createOutboundSuppression,
  createOutboundTemplate,
  deleteOutboundTemplate,
  getOutboundSettings,
  getOutboundTemplate,
  listOutboundLogs,
  listOutboundSuppressions,
  listOutboundTemplates,
  removeOutboundSuppression,
  renderOutboundTemplate,
  sendOutboundEmail,
  updateOutboundTemplate
} from "./outbound";
import { emailFromCloudflare, emailFromSimulation, processEmail } from "./processor";
import { applyStarterPack } from "./starter-pack";
import { APP_VENDOR_JS } from "./vendor.generated";
import {
  aiPage,
  analyticsPage,
  attachmentsPage,
  contactsPage,
  dashboardPage,
  deliverabilityPage,
  emailsPage,
  inboxesPage,
  loginPage,
  logsPage,
  outboundLogsPage,
  outboundPage,
  outboundTemplatesPage,
  outboundTestPage,
  ruleFormPage,
  rulesPage,
  searchPage,
  settingsPage,
  testPage,
  ticketDetailPage,
  ticketsPage,
  workflowsPage
} from "./ui";
import { enFromAr } from "./locales/ar";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.get("/assets/mailflow-enhance.js", () => {
  return new Response(APP_VENDOR_JS, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable"
    }
  });
});

app.get("/login", (c) => renderPage(c, loginPage()));
app.get("/lang/toggle", (c) => {
  const next = pageLang(c) === "en" ? "ar" : "en";
  return new Response(null, {
    status: 302,
    headers: {
      location: c.req.header("referer") || "/",
      "set-cookie": `mf_lang=${next}; Path=/; Max-Age=31536000; SameSite=Lax`
    }
  });
});
app.post("/login", async (c) => {
  const form = await c.req.formData();
  const key = String(form.get("token") || form.get("api_key") || "");
  const expectedKey = await adminKey(c.env, c.req.raw);
  if (!expectedKey || !timingSafeEqualString(key, expectedKey)) return renderPage(c, loginPage("Invalid token"), 401);
  return new Response(null, {
    status: 302,
    headers: {
      location: "/",
      "set-cookie": makeSessionCookie(await sessionValue(c.env, c.req.raw), new URL(c.req.url).protocol === "https:")
    }
  });
});
app.get("/logout", (c) => new Response(null, { status: 302, headers: { location: "/login", "set-cookie": clearSessionCookie(new URL(c.req.url).protocol === "https:") } }));

app.use("/api/v1/*", rateLimit);
app.use("/api/v1/*", bodySizeLimit);
app.use("/api/v1/*", requireAuth);
app.use("/", requireAuth);
app.use("/inboxes", requireAuth);
app.use("/rules/*", requireAuth);
app.use("/workflows", requireAuth);
app.use("/tickets/*", requireAuth);
app.use("/tickets", requireAuth);
app.use("/contacts", requireAuth);
app.use("/attachments", requireAuth);
app.use("/ai", requireAuth);
app.use("/analytics", requireAuth);
app.use("/logs", requireAuth);
app.use("/emails", requireAuth);
app.use("/test", requireAuth);
app.use("/settings", requireAuth);
app.use("/search", requireAuth);
app.use("/deliverability", requireAuth);
app.use("/outbound", requireAuth);
app.use("/outbound/*", requireAuth);

function pageLang(c: Context<{ Bindings: Env }>): "en" | "ar" {
  const match = (c.req.header("cookie") || "").match(/(?:^|;\s*)mf_lang=(en|ar)/);
  return match && match[1] === "en" ? "en" : "ar";
}

// Render a localized page: Arabic is the default; English reverses the chrome and flips to LTR.
function renderPage(c: Context<{ Bindings: Env }>, html: string, status?: number) {
  const out = pageLang(c) === "en" ? enFromAr(html).replace('<html lang="ar" dir="rtl">', '<html lang="en" dir="ltr">') : html;
  return status === undefined ? c.html(out) : c.html(out, status as 401);
}

function bareAddress(value: unknown): string {
  const raw = String(value || "");
  return raw.match(/<([^>]+)>/)?.[1] || raw.trim();
}

function buildReferences(email: Record<string, unknown> | null | undefined): string {
  if (!email) return "";
  return [String(email.references_ids || "").trim(), String(email.message_id || "").trim()].filter(Boolean).join(" ");
}

function replyApiKeyId(c: Context<{ Bindings: Env }>): string {
  return c.req.header("x-api-key") ? "admin" : "session";
}

function emailDomain(value: string): string | null {
  const clean = value.trim().toLowerCase();
  const match = clean.match(/@([a-z0-9.-]+\.[a-z]{2,})$/i);
  return match ? match[1] : null;
}

function parseAddresses(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Comma separated settings are common in the UI.
  }
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

async function deliverabilitySummary(env: Env): Promise<Record<string, unknown>> {
  const [settings, inboxes, suppressions] = await Promise.all([getOutboundSettings(env), listInboxes(env), listOutboundSuppressions(env)]);
  const inboundAddresses = inboxes.flatMap((inbox) => parseAddresses((inbox as Record<string, unknown>).email_addresses_json));
  const outboundAddresses = settings.allowedSenderAddresses;
  const domains = [...new Set([...inboundAddresses, ...outboundAddresses].map(emailDomain).filter(Boolean) as string[])].sort();
  const domainSummaries = domains.map((domain) => ({
    domain,
    receivingReady: inboundAddresses.some((address) => emailDomain(address) === domain),
    sendingReady: outboundAddresses.some((address) => emailDomain(address) === domain),
    inboundAddresses: inboundAddresses.filter((address) => emailDomain(address) === domain),
    outboundAddresses: outboundAddresses.filter((address) => emailDomain(address) === domain),
    warnings: [
      inboundAddresses.some((address) => emailDomain(address) === domain) ? "" : "missing_inbound_address",
      outboundAddresses.some((address) => emailDomain(address) === domain) ? "" : "missing_allowed_sender"
    ].filter(Boolean)
  }));
  return {
    emailBindingConfigured: Boolean(env.EMAIL),
    defaultFromEmail: settings.defaultFromEmail,
    allowedSenderAddresses: outboundAddresses,
    inboundAddresses,
    domains: domainSummaries,
    dailySendLimit: settings.dailySendLimit,
    maxRecipientsPerRequest: settings.maxRecipientsPerRequest,
    suppressionsCount: suppressions.length,
    checkedAt: new Date().toISOString(),
    warnings: [
      env.EMAIL ? "" : "email_binding_not_configured",
      domainSummaries.length ? "" : "no_email_domains_detected"
    ].filter(Boolean)
  };
}

app.get("/", (c) => renderPage(c, dashboardPage()));
app.get("/inboxes", (c) => renderPage(c, inboxesPage()));
app.get("/rules", (c) => renderPage(c, rulesPage()));
app.get("/rules/new", (c) => renderPage(c, ruleFormPage()));
app.get("/rules/:id/edit", (c) => renderPage(c, ruleFormPage(Number(c.req.param("id")))));
app.get("/workflows", (c) => renderPage(c, workflowsPage()));
app.get("/tickets", (c) => renderPage(c, ticketsPage()));
app.get("/tickets/:id", (c) => renderPage(c, ticketDetailPage(Number(c.req.param("id")))));
app.get("/contacts", (c) => renderPage(c, contactsPage()));
app.get("/attachments", (c) => renderPage(c, attachmentsPage()));
app.get("/ai", (c) => renderPage(c, aiPage()));
app.get("/analytics", (c) => renderPage(c, analyticsPage()));
app.get("/logs", (c) => renderPage(c, logsPage()));
app.get("/emails", (c) => renderPage(c, emailsPage()));
app.get("/test", (c) => renderPage(c, testPage()));
app.get("/settings", (c) => renderPage(c, settingsPage()));
app.get("/search", (c) => renderPage(c, searchPage()));
app.get("/deliverability", (c) => renderPage(c, deliverabilityPage()));
app.get("/outbound", async (c) => renderPage(c, outboundPage(await getOutboundSettings(c.env), Boolean(c.env.EMAIL))));
app.get("/outbound/templates", (c) => renderPage(c, outboundTemplatesPage()));
app.get("/outbound/logs", (c) => renderPage(c, outboundLogsPage()));
app.get("/outbound/test", async (c) => renderPage(c, outboundTestPage(await getOutboundSettings(c.env), Boolean(c.env.EMAIL))));

app.get("/api/v1/health", (c) => c.json({ ok: true, service: "mailflow-studio" }));
app.get("/api/v1/stats", async (c) => c.json(await getStats(c.env)));
app.post("/api/v1/starter-pack/apply", async (c) => c.json({ starterPack: await applyStarterPack(c.env) }));
app.get("/api/v1/emails", async (c) => c.json({ emails: await listOperationalEmails(c.env, Number(c.req.query("limit") || 100)) }));
app.get("/api/v1/inboxes", async (c) => c.json({ items: await listInboxes(c.env) }));
app.post("/api/v1/inboxes", async (c) => c.json({ item: await createInbox(c.env, await c.req.json()) }, 201));
app.get("/api/v1/contacts", async (c) => c.json({ contacts: await listContacts(c.env) }));
app.get("/api/v1/tickets", async (c) => c.json({ tickets: await listTickets(c.env) }));
app.get("/api/v1/tickets/:id", async (c) => {
  const ticket = await getTicket(c.env, Number(c.req.param("id")));
  return ticket ? c.json({ ticket }) : c.json({ error: "not_found" }, 404);
});
app.get("/api/v1/workflows", async (c) => c.json({ workflows: await listWorkflows(c.env) }));
app.post("/api/v1/workflows", async (c) => c.json({ workflow: await createWorkflow(c.env, await c.req.json()) }, 201));
app.get("/api/v1/workflow-runs", async (c) => c.json({ runs: await listWorkflowRuns(c.env) }));
app.get("/api/v1/attachments", async (c) => c.json({ attachments: await listAttachments(c.env) }));
app.get("/api/v1/ai/providers", async (c) => c.json({ providers: await listAIProviders(c.env) }));
app.post("/api/v1/ai/providers", async (c) => c.json({ provider: await createAIProvider(c.env, await c.req.json()) }, 201));
app.get("/api/v1/analytics", async (c) => c.json(await getAnalytics(c.env)));
app.get("/api/v1/audit-logs", async (c) => c.json({ logs: await listLogs(c.env, { status: c.req.query("status"), keyword: c.req.query("keyword") }) }));
app.get("/api/v1/rules", async (c) => c.json({ rules: await listRules(c.env) }));
app.post("/api/v1/rules", async (c) => c.json({ rule: await createRule(c.env, await c.req.json()) }, 201));
app.get("/api/v1/rules/:id", async (c) => {
  const rule = await getRule(c.env, Number(c.req.param("id")));
  return rule ? c.json({ rule }) : c.json({ error: "not_found" }, 404);
});
app.put("/api/v1/rules/:id", async (c) => {
  const rule = await updateRule(c.env, Number(c.req.param("id")), await c.req.json());
  return rule ? c.json({ rule }) : c.json({ error: "not_found" }, 404);
});
app.delete("/api/v1/rules/:id", async (c) => {
  const deleted = await deleteRule(c.env, Number(c.req.param("id")));
  return deleted ? c.json({ ok: true }) : c.json({ error: "not_found" }, 404);
});
app.get("/api/v1/logs", async (c) => {
  const limit = Number(c.req.query("limit") || 100);
  return c.json({ events: await listEmailEvents(c.env, limit) });
});
app.get("/api/v1/logs/:id", async (c) => {
  const event = await getEmailEvent(c.env, Number(c.req.param("id")));
  return event ? c.json({ event }) : c.json({ error: "not_found" }, 404);
});
app.post("/api/v1/test-email", async (c) => {
  const email = emailFromSimulation(await c.req.json());
  return c.json(await processEmail(c.env, email));
});
app.post("/api/v1/send-email", async (c) => {
  const result = await sendOutboundEmail(c.env, await c.req.json(), { apiKeyId: replyApiKeyId(c) });
  return result.ok ? c.json(result) : c.json(result, result.error === "email_binding_not_configured" ? 503 : 400);
});
app.post("/api/v1/emails/:id/reply", async (c) => {
  const email = await getOperationalEmail(c.env, Number(c.req.param("id")));
  if (!email) return c.json({ error: "not_found" }, 404);
  const input = await c.req.json();
  const to = bareAddress(email.reply_to || email.from_email);
  if (!to) return c.json({ error: "no_recipient" }, 400);
  const settings = await getOutboundSettings(c.env);
  const subject = String(input.subject || `Re: ${email.subject || "Your message"}`);
  const result = await sendOutboundEmail(
    c.env,
    {
      from: String(input.from || settings.defaultFromEmail),
      to,
      subject,
      text: String(input.text || ""),
      html: String(input.html || ""),
      template_id: input.template_id ? Number(input.template_id) : null,
      inReplyTo: String(email.message_id || ""),
      references: buildReferences(email),
      data: input.data || {
        name: String(email.contact_name || "there"),
        subject: String(email.subject || ""),
        ticket: `EMAIL-${email.id}`,
        topic: String(email.subject || "")
      }
    },
    { apiKeyId: replyApiKeyId(c), settings }
  );
  if (!result.ok) return c.json(result, result.error === "email_binding_not_configured" ? 503 : 400);
  await updateOperationalEmailStatus(c.env, Number(email.id), "replied");
  return c.json({ ...result, emailStatus: "replied" });
});
app.post("/api/v1/tickets/:id/reply", async (c) => {
  const ticketId = Number(c.req.param("id"));
  const ticket = await getTicket(c.env, ticketId);
  if (!ticket) return c.json({ error: "not_found" }, 404);
  const input = await c.req.json();
  const originEmail = ticket.email_id ? await getOperationalEmail(c.env, Number(ticket.email_id)) : null;
  const to = bareAddress(input.to || originEmail?.reply_to || originEmail?.from_email || ticket.contact_email);
  if (!to) return c.json({ error: "no_recipient" }, 400);
  const settings = await getOutboundSettings(c.env);
  const subject = String(input.subject || `Re: ${ticket.subject || "your ticket"}`);
  const templateId = input.template_id ? Number(input.template_id) : null;
  const data = input.data || {
    name: String(ticket.contact_name || "there"),
    subject: String(ticket.subject || ""),
    ticket: String(ticket.ticket_number || `TICKET-${ticketId}`),
    topic: String(ticket.subject || "")
  };
  const result = await sendOutboundEmail(
    c.env,
    {
      from: String(input.from || settings.defaultFromEmail),
      to,
      subject,
      text: String(input.text || ""),
      html: String(input.html || ""),
      template_id: templateId,
      inReplyTo: String(originEmail?.message_id || ""),
      references: buildReferences(originEmail),
      data
    },
    { apiKeyId: replyApiKeyId(c), settings }
  );
  if (!result.ok) return c.json(result, result.error === "email_binding_not_configured" ? 503 : 400);
  // Record what was actually sent on the timeline, rendering the template when the body came from one.
  let storedBody = String(input.text || input.html || "").trim();
  if (!storedBody && templateId) {
    const rendered = await renderOutboundTemplate(c.env, templateId, data);
    storedBody = rendered ? (rendered.text || rendered.html || "").trim() : "";
  }
  await addTicketMessage(c.env, ticketId, storedBody || "(reply sent)", "agent", { internalNote: false });
  const status = String(input.status || "pending");
  await updateTicketFields(c.env, ticketId, { status });
  return c.json({ ...result, ticketStatus: status });
});
app.post("/api/v1/tickets/:id/note", async (c) => {
  const ticketId = Number(c.req.param("id"));
  const ticket = await getTicket(c.env, ticketId);
  if (!ticket) return c.json({ error: "not_found" }, 404);
  const input = await c.req.json();
  const body = String(input.body || input.text || "").trim();
  if (!body) return c.json({ error: "empty_note" }, 400);
  await addTicketMessage(c.env, ticketId, body, "agent", { internalNote: true });
  return c.json({ ok: true });
});
app.put("/api/v1/tickets/:id", async (c) => {
  const ticket = await updateTicketFields(c.env, Number(c.req.param("id")), await c.req.json());
  return ticket ? c.json({ ticket }) : c.json({ error: "not_found" }, 404);
});
app.get("/api/v1/search", async (c) => c.json(await searchAll(c.env, c.req.query("q") || "", Number(c.req.query("limit") || 20))));
app.get("/api/v1/outbound/settings", async (c) => c.json({ settings: await getOutboundSettings(c.env), emailBindingConfigured: Boolean(c.env.EMAIL) }));
app.get("/api/v1/outbound/templates", async (c) => c.json({ templates: await listOutboundTemplates(c.env) }));
app.post("/api/v1/outbound/templates", async (c) => c.json({ template: await createOutboundTemplate(c.env, await c.req.json()) }, 201));
app.post("/api/v1/outbound/templates/:id/preview", async (c) => {
  const body = await c.req.json();
  const preview = await renderOutboundTemplate(c.env, Number(c.req.param("id")), (body.data || {}) as Record<string, unknown>);
  return preview ? c.json({ preview }) : c.json({ error: "template_not_found_or_inactive" }, 404);
});
app.get("/api/v1/outbound/templates/:id", async (c) => {
  const template = await getOutboundTemplate(c.env, Number(c.req.param("id")));
  return template ? c.json({ template }) : c.json({ error: "not_found" }, 404);
});
app.put("/api/v1/outbound/templates/:id", async (c) => {
  const template = await updateOutboundTemplate(c.env, Number(c.req.param("id")), await c.req.json());
  return template ? c.json({ template }) : c.json({ error: "not_found" }, 404);
});
app.delete("/api/v1/outbound/templates/:id", async (c) => {
  const deleted = await deleteOutboundTemplate(c.env, Number(c.req.param("id")));
  return deleted ? c.json({ ok: true }) : c.json({ error: "not_found" }, 404);
});
app.get("/api/v1/outbound/logs", async (c) => c.json({ logs: await listOutboundLogs(c.env, Number(c.req.query("limit") || 100)) }));
app.get("/api/v1/outbound/suppressions", async (c) => c.json({ suppressions: await listOutboundSuppressions(c.env, c.req.query("all") !== "true") }));
app.post("/api/v1/outbound/suppressions", async (c) => {
  try {
    return c.json({ suppression: await createOutboundSuppression(c.env, await c.req.json()) }, 201);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "invalid_suppression" }, 400);
  }
});
app.delete("/api/v1/outbound/suppressions/:id", async (c) => {
  const removed = await removeOutboundSuppression(c.env, Number(c.req.param("id")));
  return removed ? c.json({ ok: true }) : c.json({ error: "not_found" }, 404);
});
app.get("/api/v1/solo/deliverability", async (c) => c.json(await deliverabilitySummary(c.env)));
app.get("/api/v1/settings", async (c) => c.json({ settings: await listSettings(c.env) }));
app.put("/api/v1/settings", async (c) => c.json({ settings: await updateSettings(c.env, await c.req.json()) }));

app.notFound((c) => c.text("Not found", 404));
app.onError((error, c) => {
  console.error(redactSecrets(error instanceof Error ? error.message : error));
  return c.json({ error: "internal_error" }, 500);
});

export default {
  fetch: app.fetch,
  async email(message, env): Promise<void> {
    const email = await emailFromCloudflare(message);
    await processEmail(env, email);
  }
} satisfies ExportedHandler<Env>;
