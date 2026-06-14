import { describe, expect, it } from "vitest";
import { executeActions, matchRule } from "./rule-engine";
import type { EmailInput, RuleRecord } from "./types";

const baseEmail: EmailInput = {
  messageId: "msg-1",
  from: "buyer@gmail.com",
  to: "support@example.com",
  subject: "Urgent invoice question",
  body: "Can you send a proposal and quote today?",
  bodyPreview: "Can you send a proposal and quote today?",
  hasAttachments: true,
  headers: {
    "x-priority": "high"
  },
  receivedAt: "2026-06-13T18:00:00.000Z"
};

function rule(overrides: Partial<RuleRecord>): RuleRecord {
  return {
    id: 1,
    name: "Support invoices",
    active: true,
    priority: 10,
    matchMode: "all",
    conditions: {},
    actions: [],
    createdAt: "2026-06-13T18:00:00.000Z",
    updatedAt: "2026-06-13T18:00:00.000Z",
    lastMatchedAt: null,
    ...overrides
  };
}

describe("matchRule", () => {
  it("matches every configured condition when match mode is all", () => {
    const result = matchRule(
      baseEmail,
      rule({
        matchMode: "all",
        conditions: {
          recipient_contains: "support@",
          sender_contains: "@gmail.com",
          subject_contains: "invoice",
          body_contains: "proposal",
          has_attachment: true,
          header_contains: { name: "x-priority", value: "high" },
          keywords: ["quote", "today"]
        }
      })
    );

    expect(result).toBe(true);
  });

  it("matches one configured condition when match mode is any", () => {
    const result = matchRule(
      baseEmail,
      rule({
        matchMode: "any",
        conditions: {
          sender_contains: "@not-this.test",
          subject_contains: "invoice"
        }
      })
    );

    expect(result).toBe(true);
  });

  it("does not match inactive rules", () => {
    expect(
      matchRule(
        baseEmail,
        rule({
          active: false,
          conditions: { subject_contains: "invoice" }
        })
      )
    ).toBe(false);
  });
});

describe("executeActions", () => {
  it("masks secret-dependent actions and returns deterministic result records", async () => {
    const results = await executeActions(
      baseEmail,
      rule({
        actions: [
          { type: "save" },
          { type: "telegram", template: "New email from {{from}}: {{subject}}" },
          { type: "webhook", url: "https://example.com/inbound", method: "POST" },
          { type: "ignore" }
        ]
      }),
      {
        telegramBotToken: undefined,
        telegramChatId: undefined,
        fetcher: async () => new Response("ok", { status: 200 })
      }
    );

    expect(results.map((result) => result.actionType)).toEqual([
      "save",
      "telegram",
      "webhook",
      "ignore"
    ]);
    expect(results[1]).toMatchObject({
      actionType: "telegram",
      status: "failed",
      error: "Telegram token or chat ID is not configured"
    });
    expect(results[2]).toMatchObject({
      actionType: "webhook",
      status: "success"
    });
  });

  it("retries failed webhook actions before succeeding", async () => {
    let attempts = 0;
    const results = await executeActions(
      baseEmail,
      rule({
        actions: [{ type: "webhook", url: "https://example.com/inbound", method: "POST" }]
      }),
      {
        webhookRetriesCount: 2,
        fetcher: async () => {
          attempts++;
          return new Response("ok", { status: attempts < 3 ? 503 : 200 });
        }
      }
    );

    expect(attempts).toBe(3);
    expect(results[0]).toMatchObject({ actionType: "webhook", status: "success" });
  });
});
