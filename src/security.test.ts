import { describe, expect, it } from "vitest";
import { redactSecrets, safeOutboundUrl, sanitizeHtmlEmail, timingSafeEqualString } from "./security";

describe("security hardening helpers", () => {
  it("uses deterministic safe equality for API keys", () => {
    expect(timingSafeEqualString("same-key", "same-key")).toBe(true);
    expect(timingSafeEqualString("same-key", "same-keZ")).toBe(false);
    expect(timingSafeEqualString("same-key", "same-key-longer")).toBe(false);
  });

  it("blocks unsafe outbound webhook URLs", () => {
    expect(safeOutboundUrl("https://hooks.example.com/path")).toEqual({ ok: true, url: "https://hooks.example.com/path" });
    expect(safeOutboundUrl("http://hooks.example.com/path")).toEqual({ ok: false, reason: "URL must use HTTPS" });
    expect(safeOutboundUrl("https://127.0.0.1/admin")).toEqual({ ok: false, reason: "URL host is not allowed" });
    expect(safeOutboundUrl("https://169.254.169.254/latest/meta-data")).toEqual({ ok: false, reason: "URL host is not allowed" });
    expect(safeOutboundUrl("https://user:pass@example.com")).toEqual({ ok: false, reason: "URL credentials are not allowed" });
  });

  it("sanitizes active HTML email content", () => {
    expect(sanitizeHtmlEmail('<p onclick="steal()">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>')).toBe("<p>Hi</p><a>x</a>");
  });

  it("redacts common secret shapes from logs", () => {
    expect(redactSecrets("token sk-testsecret123456 and bot12345:telegramTOKEN")).not.toContain("sk-testsecret");
  });
});
