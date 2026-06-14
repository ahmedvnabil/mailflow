import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Miniflare } from "miniflare";
import { listInboxes, listRules } from "./db";
import { listOutboundTemplates } from "./outbound";
import { applyStarterPack } from "./starter-pack";
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

describe("MailFlow starter pack", () => {
  it("creates a support inbox, default support rule, and starter templates once", async () => {
    const first = await applyStarterPack(env);
    const second = await applyStarterPack(env);

    const inboxes = await listInboxes(env);
    const rules = await listRules(env);
    const templates = await listOutboundTemplates(env);

    expect(first).toMatchObject({ createdInboxes: 1, createdRules: 1, createdTemplates: 5 });
    expect(second).toMatchObject({ createdInboxes: 0, createdRules: 0, createdTemplates: 0 });
    expect(inboxes.map((inbox) => inbox.name)).toContain("Support");
    expect(rules.map((rule) => rule.name)).toContain("Support intake");
    expect(templates.map((template) => template.name)).toEqual(
      expect.arrayContaining(["Support received", "Ticket update", "Follow up", "Quote reply", "Welcome"])
    );
  });
});
