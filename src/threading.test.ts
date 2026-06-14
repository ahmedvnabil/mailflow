import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Miniflare } from "miniflare";
import app from "./index";
import { createRule, listTickets, searchAll } from "./db";
import { createOutboundTemplate } from "./outbound";
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
  // A rule that opens a ticket for every inbound email.
  await createRule(env, {
    name: "Open ticket",
    active: true,
    priority: 1,
    matchMode: "all",
    conditions: {},
    actions: [{ type: "create_ticket", priority: "normal" }]
  });
});

afterEach(async () => {
  await mf.dispose();
});

function inbound(overrides: Partial<Parameters<typeof processEmail>[1]>) {
  return {
    messageId: "msg@example.com",
    from: "Client <client@example.com>",
    to: "support@example.com",
    subject: "Need help",
    body: "Original question",
    bodyPreview: "Original question",
    hasAttachments: false,
    attachments: [],
    headers: {},
    receivedAt: "2026-06-14T06:00:00.000Z",
    ...overrides
  };
}

describe("email threading", () => {
  it("threads a reply onto the existing ticket via In-Reply-To instead of opening a new one", async () => {
    await processEmail(env, inbound({ messageId: "first@example.com", subject: "Need help" }));
    let tickets = await listTickets(env);
    expect(tickets).toHaveLength(1);
    const ticketId = Number(tickets[0].id);

    await processEmail(
      env,
      inbound({
        messageId: "second@example.com",
        subject: "Re: Need help",
        inReplyTo: "first@example.com",
        body: "Following up on this",
        bodyPreview: "Following up on this"
      })
    );

    tickets = await listTickets(env);
    expect(tickets).toHaveLength(1);

    const response = await app.fetch(
      new Request(`http://localhost/api/v1/tickets/${ticketId}`, { headers: { "x-api-key": "dev-admin-key" } }),
      env
    );
    const data = (await response.json()) as { ticket: { messages: Array<{ body: string; author_type: string }> } };
    expect(data.ticket.messages.length).toBe(2);
    expect(data.ticket.messages.map((m) => m.body)).toContain("Following up on this");
  });

  it("threads a reply by normalized subject when headers are missing", async () => {
    await processEmail(env, inbound({ messageId: "a@example.com", subject: "Invoice question" }));
    await processEmail(env, inbound({ messageId: "b@example.com", subject: "RE: Invoice question", body: "Still waiting" }));

    const tickets = await listTickets(env);
    expect(tickets).toHaveLength(1);
  });

  it("does not merge a brand new email that merely shares a subject", async () => {
    await processEmail(env, inbound({ messageId: "x@example.com", subject: "Invoice question" }));
    await processEmail(env, inbound({ messageId: "y@example.com", subject: "Invoice question" }));

    const tickets = await listTickets(env);
    expect(tickets).toHaveLength(2);
  });
});

describe("ticket reply", () => {
  it("sends an agent reply, logs it on the thread, and updates ticket status", async () => {
    await processEmail(env, inbound({ messageId: "first@example.com", subject: "Need help" }));
    const ticketId = Number((await listTickets(env))[0].id);

    const send = vi.fn().mockResolvedValue(undefined);
    const response = await app.fetch(
      new Request(`http://localhost/api/v1/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": "dev-admin-key" },
        body: JSON.stringify({ from: "support@example.com", text: "Here is your answer.", status: "pending" })
      }),
      { ...env, EMAIL: { send } }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, status: "sent", ticketStatus: "pending" });
    expect(send).toHaveBeenCalledOnce();

    const detail = await app.fetch(
      new Request(`http://localhost/api/v1/tickets/${ticketId}`, { headers: { "x-api-key": "dev-admin-key" } }),
      { ...env, EMAIL: { send } }
    );
    const data = (await detail.json()) as { ticket: { status: string; messages: Array<{ author_type: string; body: string }> } };
    expect(data.ticket.status).toBe("pending");
    expect(data.ticket.messages.some((m) => m.author_type === "agent" && m.body.includes("Here is your answer."))).toBe(true);
  });

  it("records the rendered template text on the timeline when replying with a template", async () => {
    await processEmail(env, inbound({ messageId: "first@example.com", subject: "Need help", from: "Sam <sam@example.com>" }));
    const ticketId = Number((await listTickets(env))[0].id);
    const template = await createOutboundTemplate(env, {
      name: "Ack",
      subject: "We got it",
      text_body: "Hello {{name}}, we received your request and are on it.",
      html_body: "",
      variables_json: ["name"],
      active: true
    });

    const send = vi.fn().mockResolvedValue(undefined);
    const response = await app.fetch(
      new Request(`http://localhost/api/v1/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": "dev-admin-key" },
        body: JSON.stringify({ from: "support@example.com", template_id: template.id, data: { name: "Sam" } })
      }),
      { ...env, EMAIL: { send } }
    );
    expect(response.status).toBe(200);

    const detail = await app.fetch(
      new Request(`http://localhost/api/v1/tickets/${ticketId}`, { headers: { "x-api-key": "dev-admin-key" } }),
      env
    );
    const data = (await detail.json()) as { ticket: { messages: Array<{ author_type: string; body: string }> } };
    const agentMessage = data.ticket.messages.find((m) => m.author_type === "agent");
    expect(agentMessage?.body).toBe("Hello Sam, we received your request and are on it.");
  });

  it("adds an internal note without sending email", async () => {
    await processEmail(env, inbound({ messageId: "first@example.com" }));
    const ticketId = Number((await listTickets(env))[0].id);

    const send = vi.fn();
    const response = await app.fetch(
      new Request(`http://localhost/api/v1/tickets/${ticketId}/note`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": "dev-admin-key" },
        body: JSON.stringify({ body: "Customer is a VIP, prioritize." })
      }),
      { ...env, EMAIL: { send } }
    );

    expect(response.status).toBe(200);
    expect(send).not.toHaveBeenCalled();

    const detail = await app.fetch(
      new Request(`http://localhost/api/v1/tickets/${ticketId}`, { headers: { "x-api-key": "dev-admin-key" } }),
      env
    );
    const data = (await detail.json()) as { ticket: { messages: Array<{ internal_note: number; body: string }> } };
    expect(data.ticket.messages.some((m) => Number(m.internal_note) === 1 && m.body.includes("VIP"))).toBe(true);
  });
});

describe("unified search", () => {
  it("finds matching emails, tickets, and contacts", async () => {
    await processEmail(env, inbound({ messageId: "search-1@example.com", from: "Jane <jane@acme.com>", subject: "Invoice overdue", body: "Please advise" }));

    const direct = await searchAll(env, "invoice");
    expect((direct.emails as unknown[]).length).toBeGreaterThan(0);
    expect((direct.tickets as unknown[]).length).toBeGreaterThan(0);

    const response = await app.fetch(
      new Request("http://localhost/api/v1/search?q=acme", { headers: { "x-api-key": "dev-admin-key" } }),
      env
    );
    expect(response.status).toBe(200);
    const data = (await response.json()) as { contacts: Array<{ email: string }> };
    expect(data.contacts.some((c) => c.email === "jane@acme.com")).toBe(true);
  });

  it("returns empty groups for a blank query", async () => {
    const data = await searchAll(env, "   ");
    expect(data).toMatchObject({ emails: [], tickets: [], contacts: [] });
  });
});
