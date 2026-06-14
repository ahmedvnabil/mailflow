import { createInbox, createRule, listInboxes, listRules, updateSettings } from "./db";
import { createOutboundTemplate, listOutboundTemplates } from "./outbound";
import type { Env } from "./types";

const SUPPORT_EMAIL = "support@yourdomain.com";
const NOREPLY_EMAIL = "noreply@yourdomain.com";

const starterTemplates = [
  {
    name: "Support received",
    subject: "We received your message: {{subject}}",
    text_body:
      "Hi {{name}},\n\nThanks for reaching out. I received your message and will reply as soon as possible.\n\nReference: {{ticket}}\n\nBest,\nMailFlow Support",
    html_body:
      "<p>Hi {{name}},</p><p>Thanks for reaching out. I received your message and will reply as soon as possible.</p><p>Reference: {{ticket}}</p><p>Best,<br>MailFlow Support</p>",
    variables_json: ["name", "subject", "ticket"]
  },
  {
    name: "Ticket update",
    subject: "Update on {{ticket}}",
    text_body: "Hi {{name}},\n\nQuick update on {{ticket}}:\n\n{{update}}\n\nBest,\nMailFlow Support",
    html_body: "<p>Hi {{name}},</p><p>Quick update on {{ticket}}:</p><p>{{update}}</p><p>Best,<br>MailFlow Support</p>",
    variables_json: ["name", "ticket", "update"]
  },
  {
    name: "Follow up",
    subject: "Following up on {{topic}}",
    text_body: "Hi {{name}},\n\nJust following up on {{topic}}. Let me know if you need anything else from my side.\n\nBest,\nMailFlow Support",
    html_body:
      "<p>Hi {{name}},</p><p>Just following up on {{topic}}. Let me know if you need anything else from my side.</p><p>Best,<br>MailFlow Support</p>",
    variables_json: ["name", "topic"]
  },
  {
    name: "Quote reply",
    subject: "Quote request received",
    text_body:
      "Hi {{name}},\n\nThanks for the quote request. I am reviewing the details and will send the next step shortly.\n\nProject: {{project}}\n\nBest,\nMailFlow Support",
    html_body:
      "<p>Hi {{name}},</p><p>Thanks for the quote request. I am reviewing the details and will send the next step shortly.</p><p>Project: {{project}}</p><p>Best,<br>MailFlow Support</p>",
    variables_json: ["name", "project"]
  },
  {
    name: "Welcome",
    subject: "Welcome to MailFlow",
    text_body: "Hi {{name}},\n\nWelcome to MailFlow. Your request is now tracked here and I will keep everything organized.\n\nBest,\nMailFlow Support",
    html_body:
      "<p>Hi {{name}},</p><p>Welcome to MailFlow. Your request is now tracked here and I will keep everything organized.</p><p>Best,<br>MailFlow Support</p>",
    variables_json: ["name"]
  }
];

export interface StarterPackResult {
  createdInboxes: number;
  createdRules: number;
  createdTemplates: number;
  supportEmail: string;
  defaultFromEmail: string;
}

export async function applyStarterPack(env: Env): Promise<StarterPackResult> {
  let createdInboxes = 0;
  let createdRules = 0;
  let createdTemplates = 0;

  await updateSettings(env, {
    default_from_email: SUPPORT_EMAIL,
    allowed_sender_addresses: `${SUPPORT_EMAIL},${NOREPLY_EMAIL}`,
    default_inbox: SUPPORT_EMAIL,
    outbound_enabled: "true",
    require_verified_sender_warning: "true",
    daily_send_limit: "50",
    max_recipients_per_request: "5",
    auto_ticket_enabled: "true",
    ai_enabled: "false"
  });

  const inboxes = await listInboxes(env);
  const hasSupportInbox = inboxes.some((inbox) => {
    const addresses = String(inbox.email_addresses_json || "");
    return String(inbox.name).toLowerCase() === "support" || addresses.includes(SUPPORT_EMAIL);
  });
  if (!hasSupportInbox) {
    await createInbox(env, {
      name: "Support",
      description: "Default MailFlow support inbox.",
      email_addresses: SUPPORT_EMAIL,
      assigned_team: "Owner",
      color: "#059669",
      priority: 10,
      status: "active"
    });
    createdInboxes += 1;
  }

  const rules = await listRules(env);
  if (!rules.some((rule) => rule.name === "Support intake")) {
    await createRule(env, {
      name: "Support intake",
      active: true,
      priority: 10,
      matchMode: "any",
      conditions: {
        recipient_contains: "support@",
        recipient_equals: SUPPORT_EMAIL
      },
      actions: [{ type: "create_ticket", priority: "normal" }, { type: "save" }]
    });
    createdRules += 1;
  }

  const existingTemplates = new Set((await listOutboundTemplates(env)).map((template) => template.name));
  for (const template of starterTemplates) {
    if (existingTemplates.has(template.name)) continue;
    await createOutboundTemplate(env, { ...template, active: true });
    createdTemplates += 1;
  }

  return {
    createdInboxes,
    createdRules,
    createdTemplates,
    supportEmail: SUPPORT_EMAIL,
    defaultFromEmail: SUPPORT_EMAIL
  };
}
