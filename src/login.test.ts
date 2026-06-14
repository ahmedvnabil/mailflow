import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Miniflare } from "miniflare";
import worker from "./index";
import { loginPage } from "./ui";
import type { Env } from "./types";

let mf: Miniflare;
let env: Env;

beforeEach(async () => {
  mf = new Miniflare({
    modules: true,
    script: "export default {}",
    d1Databases: ["DB"],
    kvNamespaces: ["CONFIG_CACHE"],
    r2Buckets: ["ATTACHMENTS"]
  });
  env = { ...((await mf.getBindings<Env>()) as Env), ADMIN_API_KEY: "secret-token" };
});

afterEach(async () => {
  await mf.dispose();
});

describe("token login", () => {
  it("renders a token login form", () => {
    const html = loginPage();

    expect(html).toContain('name="token"');
    expect(html).toContain("رمز الدخول");
    expect(html).not.toContain('name="api_key"');
  });

  it("opens the dashboard when the posted token matches the admin key", async () => {
    const response = await worker.fetch(
      new Request("https://mailflow.example/login", {
        method: "POST",
        body: new URLSearchParams({ token: "secret-token" })
      }),
      env,
      {} as ExecutionContext
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/");
    expect(response.headers.get("set-cookie")).toContain("egs_session=");
  });
});
