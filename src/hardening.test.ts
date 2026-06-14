import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Miniflare } from "miniflare";
import { createRule, createWorkflow, getAnalytics, listAttachments, listContacts, listLogs, listOperationalEmails, listTickets, listWorkflowRuns } from "./db";
import { processEmail } from "./processor";
import { executeActions } from "./rule-engine";
import type { EmailInput, Env, RuleRecord } from "./types";

let mf: Miniflare;
let env: Env;

function email(overrides: Partial<EmailInput> = {}): EmailInput {
  return {
    messageId: "message-1@example.com",
    from: "Client <client@example.com>",
    to: "support@example.com",
    subject: "Ticket request",
    body: "Please create a support ticket.",
    bodyPreview: "Please create a support ticket.",
    hasAttachments: false,
    attachments: [],
    headers: {},
    receivedAt: "2026-06-13T12:00:00.000Z",
    ...overrides
  };
}

beforeEach(async () => {
  mf = new Miniflare({
    modules: true,
    script: "export default {}",
    d1Databases: ["DB"],
    kvNamespaces: ["CONFIG_CACHE"],
    r2Buckets: ["ATTACHMENTS"]
  });
  env = (await mf.getBindings<Env>()) as Env;
});

afterEach(async () => {
  await mf.dispose();
});

describe("production hardening integration", () => {
  it("ingests an email once, creates contact/ticket/workflow logs, and produces analytics rows", async () => {
    await createRule(env, {
      name: "Ticket rule",
      active: true,
      priority: 1,
      matchMode: "all",
      conditions: { recipient_contains: "support@" },
      actions: [{ type: "create_ticket", priority: "high" }, { type: "save" }]
    });
    await createWorkflow(env, {
      name: "Audit workflow",
      active: true,
      trigger_type: "new_email",
      actions: [{ type: "save" }]
    });

    const result = await processEmail(env, email());

    expect(result.event.status).toBe("success");
    expect(await listOperationalEmails(env)).toHaveLength(1);
    expect(await listContacts(env)).toHaveLength(1);
    expect(await listTickets(env)).toHaveLength(1);
    expect(await listWorkflowRuns(env)).toHaveLength(1);
    expect((await listLogs(env)).map((row) => row.event_type)).toContain("ticket_created");
    expect((await getAnalytics(env)).emailsPerDay).toEqual([{ label: "2026-06-13", value: 1 }]);
  });

  it("treats duplicate message IDs as idempotent", async () => {
    await processEmail(env, email());
    await processEmail(env, email());

    expect(await listOperationalEmails(env)).toHaveLength(1);
    expect(await listContacts(env)).toHaveLength(1);
  });

  it("indexes attachment metadata even when R2 content storage is unavailable", async () => {
    const envWithoutR2 = { ...env, ATTACHMENTS: undefined };

    await processEmail(
      envWithoutR2,
      email({
        hasAttachments: true,
        attachments: [{ filename: "invoice.pdf", mimeType: "application/pdf", size: 12 }]
      })
    );

    const attachments = await listAttachments(env);
    expect(attachments).toHaveLength(1);
    expect(attachments[0]).toMatchObject({ filename: "invoice.pdf", r2_key: null });
  });

  it("fails AI actions safely when the provider is disabled or missing", async () => {
    const rule: RuleRecord = {
      id: 1,
      name: "AI classify",
      active: true,
      priority: 1,
      matchMode: "all",
      conditions: {},
      actions: [{ type: "ai_classify", provider: "openai" }],
      createdAt: "2026-06-13T12:00:00.000Z",
      updatedAt: "2026-06-13T12:00:00.000Z",
      lastMatchedAt: null
    };

    const results = await executeActions(email(), rule, {});

    expect(results[0]).toMatchObject({
      actionType: "ai_classify",
      status: "failed",
      error: "AI automation is disabled"
    });
  });
});
