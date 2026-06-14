import type { Context, Next } from "hono";
import type { Env } from "./types";
import { ensureSchema, getEffectiveSetting } from "./db";
import { timingSafeEqualString } from "./security";
import { productionSettingsFrom } from "./settings";

const SESSION_COOKIE = "egs_session";
const fallbackRateBuckets = new Map<string, { count: number; expiresAt: number }>();

function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of (header || "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(value.join("="));
  }
  return cookies;
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isLocalRequest(request?: Request): boolean {
  if (!request) return false;
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export async function adminKey(env: Env, request?: Request): Promise<string> {
  await ensureSchema(env);
  const configured = (await getEffectiveSetting(env, "admin_api_key")) || env.ADMIN_API_KEY;
  if (configured) return configured;
  if (isLocalRequest(request)) return "dev-admin-key";
  return "";
}

export async function sessionValue(env: Env, request?: Request): Promise<string> {
  return sha256(await adminKey(env, request));
}

export async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  const expectedKey = await adminKey(env, request);
  if (!expectedKey) return false;
  const headerKey = request.headers.get("x-api-key");
  if (headerKey && timingSafeEqualString(headerKey, expectedKey)) return true;

  const cookies = parseCookies(request.headers.get("cookie"));
  return timingSafeEqualString(cookies[SESSION_COOKIE] || "", await sessionValue(env, request));
}

export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next): Promise<Response | void> {
  if (await isAuthorized(c.req.raw, c.env)) return next();
  if (c.req.path.startsWith("/api/")) {
    return c.json({ error: "unauthorized" }, 401);
  }
  return c.redirect("/login");
}

export async function rateLimit(c: Context<{ Bindings: Env }>, next: Next): Promise<Response | void> {
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "local";
  const bucket = new Date().toISOString().slice(0, 16);
  const key = `rate:${ip}:${bucket}`;
  if (!c.env.CONFIG_CACHE) {
    const now = Date.now();
    const current = fallbackRateBuckets.get(key);
    const count = current && current.expiresAt > now ? current.count : 0;
    if (count > 120) return c.json({ error: "rate_limited" }, 429);
    fallbackRateBuckets.set(key, { count: count + 1, expiresAt: now + 90_000 });
    return next();
  }

  const current = Number((await c.env.CONFIG_CACHE.get(key)) || 0);
  if (current > 120) return c.json({ error: "rate_limited" }, 429);
  await c.env.CONFIG_CACHE.put(key, String(current + 1), { expirationTtl: 90 });
  return next();
}

export async function bodySizeLimit(c: Context<{ Bindings: Env }>, next: Next): Promise<Response | void> {
  const contentLength = Number(c.req.header("content-length") || 0);
  const settings = productionSettingsFrom({
    max_request_body_bytes: await getEffectiveSetting(c.env, "max_request_body_bytes")
  });
  if (contentLength > settings.maxRequestBodyBytes) {
    return c.json({ error: "request_body_too_large" }, 413);
  }
  return next();
}

export function makeSessionCookie(value: string, secure = true): string {
  const securePart = secure ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; HttpOnly${securePart}; SameSite=Lax; Path=/; Max-Age=604800`;
}

export function clearSessionCookie(secure = true): string {
  const securePart = secure ? "; Secure" : "";
  return `${SESSION_COOKIE}=; HttpOnly${securePart}; SameSite=Lax; Path=/; Max-Age=0`;
}
