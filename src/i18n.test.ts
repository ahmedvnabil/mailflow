import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Miniflare } from "miniflare";
import app from "./index";
import { enFromAr, localizeHtml } from "./locales/ar";
import type { Env } from "./types";

let mf: Miniflare;
let env: Env;

beforeEach(async () => {
  mf = new Miniflare({ modules: true, script: "export default {}", d1Databases: ["DB"], kvNamespaces: ["CONFIG_CACHE"] });
  env = (await mf.getBindings<Env>()) as Env;
});
afterEach(async () => {
  await mf.dispose();
});

describe("bilingual rendering", () => {
  it("round-trips chrome between English and Arabic", () => {
    const en = '<a href="/">Dashboard</a><span>Settings</span>';
    const ar = localizeHtml(en);
    expect(ar).toContain("لوحة التحكم");
    expect(enFromAr(ar)).toContain("Dashboard");
    expect(enFromAr(ar)).toContain("Settings");
  });

  it("serves the login page in Arabic (RTL) by default", async () => {
    const res = await app.fetch(new Request("http://localhost/login"), env);
    const html = await res.text();
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("رمز الدخول"); // "Access token" localized
  });

  it("serves the login page in English (LTR) when mf_lang=en", async () => {
    const res = await app.fetch(new Request("http://localhost/login", { headers: { cookie: "mf_lang=en" } }), env);
    const html = await res.text();
    expect(html).toContain('lang="en"');
    expect(html).toContain('dir="ltr"');
    expect(html).toContain("Access token");
    expect(html).not.toContain("رمز الدخول");
  });

  it("toggles the language cookie and redirects", async () => {
    const res = await app.fetch(new Request("http://localhost/lang/toggle", { headers: { referer: "http://localhost/settings" } }), env);
    expect(res.status).toBe(302);
    expect(res.headers.get("set-cookie") || "").toContain("mf_lang=en");
    expect(res.headers.get("location")).toBe("http://localhost/settings");
  });
});
