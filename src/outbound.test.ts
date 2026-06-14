import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Miniflare } from "miniflare";
import app from "./index";
import {
  createOutboundSuppression,
  createOutboundTemplate,
  getOutboundSettings,
  listOutboundSuppressions,
  listOutboundLogs,
  renderOutboundTemplate,
  sendOutboundEmail
} from "./outbound";
import { createInbox, updateSettings } from "./db";
import { processEmail } from "./processor";
import type { Env } from "./types";

let mf: Miniflare;
let env: Env;

beforeEach(async () => {
  mf = new Miniflare({
    modules: true,
    script: "export default {}",
    d1Databases: ["DB"],
    kvNamespaces: ["CONFIG_CACHE"]
  });
  env = (await mf.getBindings<Env>()) as Env;
});

afterEach(async () => {
  await mf.dispose();
});

describe("outbound email service", () => {
  it("fails safely and logs when the Cloudflare EMAIL binding is missing", async () => {
    const result = await sendOutboundEmail(env, {
      from: "noreply@example.com",
      to: "user@example.com",
      subject: "Welcome",
      text: "Hello"
    });

    expect(result).toMatchObject({ ok: false, error: "email_binding_not_configured" });
    const logs = await listOutboundLogs(env);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      from_email: "noreply@example.com",
      to_email: "user@example.com",
      status: "failed",
      provider: "cloudflare_email",
      error: "email_binding_not_configured"
    });
  });

  it("validates the sender against allowed sender settings", async () => {
    await expect(
      sendOutboundEmail(
        { ...env, EMAIL: { send: vi.fn() } },
        {
          from: "attacker@example.net",
          to: "user@example.com",
          subject: "Relay attempt",
          text: "Nope"
        }
      )
    ).resolves.toMatchObject({ ok: false, error: "sender_not_allowed" });
  });

  it("validates recipient addresses", async () => {
    await expect(
      sendOutboundEmail(
        { ...env, EMAIL: { send: vi.fn() } },
        {
          from: "noreply@example.com",
          to: "not-an-email",
          subject: "Bad recipient",
          text: "Nope"
        }
      )
    ).resolves.toMatchObject({ ok: false, error: "invalid_recipient" });
  });

  it("renders templates with supplied data", async () => {
    const template = await createOutboundTemplate(env, {
      name: "OTP",
      subject: "Your code is {{code}}",
      text_body: "Use {{code}} for {{product}}.",
      html_body: "<p>Use <strong>{{code}}</strong> for {{product}}.</p>",
      variables_json: ["code", "product"],
      active: true
    });

    const rendered = await renderOutboundTemplate(env, template.id, { code: "123456", product: "MailFlow" });

    expect(rendered).toEqual({
      subject: "Your code is 123456",
      text: "Use 123456 for MailFlow.",
      html: "<p>Use <strong>123456</strong> for MailFlow.</p>"
    });
  });

  it("sends through the EMAIL binding and creates a success log", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const result = await sendOutboundEmail(
      { ...env, EMAIL: { send } },
      {
        from: "noreply@example.com",
        to: "user@example.com",
        subject: "Welcome",
        text: "Hello",
        html: "<p>Hello</p>"
      },
      { apiKeyId: "admin" }
    );

    expect(result).toMatchObject({ ok: true, status: "sent" });
    expect(send).toHaveBeenCalledOnce();
    const logs = await listOutboundLogs(env);
    expect(logs[0]).toMatchObject({ status: "sent", subject: "Welcome", error: null });
  });

  it("blocks suppressed recipients before sending", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const suppression = await createOutboundSuppression(env, {
      email: "blocked@example.com",
      reason: "manual block"
    });

    expect(suppression).toMatchObject({ email: "blocked@example.com", active: true });

    const result = await sendOutboundEmail(
      { ...env, EMAIL: { send } },
      {
        from: "noreply@example.com",
        to: "blocked@example.com",
        subject: "Welcome",
        text: "Hello"
      }
    );

    expect(result).toMatchObject({ ok: false, error: "recipient_suppressed" });
    expect(send).not.toHaveBeenCalled();
    const suppressions = await listOutboundSuppressions(env);
    expect(suppressions).toHaveLength(1);
  });

  it("enforces the configured daily API key limit", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const settings = await getOutboundSettings(env);

    await sendOutboundEmail(
      { ...env, EMAIL: { send } },
      { from: "noreply@example.com", to: "first@example.com", subject: "One", text: "One" },
      { apiKeyId: "limited-key", settings: { ...settings, dailySendLimit: 1 } }
    );
    const second = await sendOutboundEmail(
      { ...env, EMAIL: { send } },
      { from: "noreply@example.com", to: "second@example.com", subject: "Two", text: "Two" },
      { apiKeyId: "limited-key", settings: { ...settings, dailySendLimit: 1 } }
    );

    expect(second).toMatchObject({ ok: false, error: "daily_send_limit_exceeded" });
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe("POST /api/v1/send-email", () => {
  it("serves the local enhancement bundle", async () => {
    const response = await app.fetch(new Request("http://localhost/assets/mailflow-enhance.js"), env);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/javascript");
    const body = await response.text();
    expect(body).toContain("MailFlowEnhance");
  });

  it("requires API authentication", async () => {
    const response = await app.fetch(
      new Request("http://example.com/api/v1/send-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: "noreply@example.com", to: "user@example.com", subject: "Welcome", text: "Hello" })
      }),
      env
    );

    expect(response.status).toBe(401);
  });

  it("accepts authenticated send requests", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const response = await app.fetch(
      new Request("http://localhost/api/v1/send-email", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": "dev-admin-key" },
        body: JSON.stringify({ from: "noreply@example.com", to: "user@example.com", subject: "Welcome", text: "Hello" })
      }),
      { ...env, EMAIL: { send } }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, status: "sent" });
  });

  it("previews outbound templates without sending", async () => {
    const template = await createOutboundTemplate(env, {
      name: "Quote",
      subject: "Quote for {{name}}",
      text_body: "Hello {{name}}, quote {{quote_id}} is ready.",
      html_body: "<p>Hello {{name}}</p>",
      variables_json: ["name", "quote_id"],
      active: true
    });

    const response = await app.fetch(
      new Request(`http://localhost/api/v1/outbound/templates/${template.id}/preview`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": "dev-admin-key" },
        body: JSON.stringify({ data: { name: "Ali", quote_id: "Q-1" } })
      }),
      env
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      preview: {
        subject: "Quote for Ali",
        text: "Hello Ali, quote Q-1 is ready.",
        html: "<p>Hello Ali</p>"
      }
    });
  });

  it("reports deliverability for multiple configured domains", async () => {
    await updateSettings(env, {
      allowed_sender_addresses: "support@example.com,noreply@example.net",
      default_from_email: "support@example.com"
    });
    await createInbox(env, {
      name: "Support",
      email_addresses: "support@example.com,team@example.net"
    });

    const response = await app.fetch(
      new Request("http://localhost/api/v1/solo/deliverability", {
        headers: { "x-api-key": "dev-admin-key" }
      }),
      { ...env, EMAIL: { send: vi.fn() } }
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as { domains: Array<{ domain: string; receivingReady: boolean; sendingReady: boolean }> };
    expect(data.domains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ domain: "example.com", receivingReady: true, sendingReady: true }),
        expect.objectContaining({ domain: "example.net", receivingReady: true, sendingReady: true })
      ])
    );
  });

  it("replies to a stored inbound email and marks it replied", async () => {
    await processEmail(env, {
      messageId: "inbound-1@example.com",
      from: "Client <client@example.com>",
      to: "support@example.com",
      subject: "Need help",
      body: "Can you help?",
      bodyPreview: "Can you help?",
      hasAttachments: false,
      attachments: [],
      headers: {},
      receivedAt: "2026-06-14T06:00:00.000Z"
    });

    const send = vi.fn().mockResolvedValue(undefined);
    const response = await app.fetch(
      new Request("http://localhost/api/v1/emails/1/reply", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": "dev-admin-key" },
        body: JSON.stringify({ text: "Thanks, I am checking this now." })
      }),
      { ...env, EMAIL: { send } }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, status: "sent", emailStatus: "replied" });
    expect(send).toHaveBeenCalledOnce();
    const logs = await listOutboundLogs(env);
    expect(logs[0]).toMatchObject({
      from_email: "support@yourdomain.com",
      to_email: "client@example.com",
      subject: "Re: Need help",
      status: "sent"
    });
  });
});
