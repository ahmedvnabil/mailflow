const SECRET_PATTERNS = [
  /([A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})/g,
  /(sk-[A-Za-z0-9_-]{12,})/g,
  /(xox[baprs]-[A-Za-z0-9-]+)/g,
  /(bot[0-9]+:[A-Za-z0-9_-]+)/g
];

const PRIVATE_HOSTS = new Set(["localhost", "metadata.google.internal"]);
const BLOCKED_IPS = new Set(["0.0.0.0", "127.0.0.1", "169.254.169.254", "::1"]);

export function timingSafeEqualString(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;
  for (let i = 0; i < length; i++) {
    diff |= (leftBytes[i] || 0) ^ (rightBytes[i] || 0);
  }
  return diff === 0;
}

export function redactSecrets(value: unknown): string {
  let output = typeof value === "string" ? value : JSON.stringify(value);
  for (const pattern of SECRET_PATTERNS) output = output.replace(pattern, "[redacted]");
  return output;
}

export function sanitizeHtmlEmail(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "");
}

function isBlockedIPv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}

export function safeOutboundUrl(url: string | undefined, allowHttp = false): { ok: true; url: string } | { ok: false; reason: string } {
  if (!url) return { ok: false, reason: "URL is missing" };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && !(allowHttp && parsed.protocol === "http:")) {
      return { ok: false, reason: "URL must use HTTPS" };
    }
    const hostname = parsed.hostname.toLowerCase();
    if (PRIVATE_HOSTS.has(hostname) || BLOCKED_IPS.has(hostname) || hostname.endsWith(".local") || isBlockedIPv4(hostname)) {
      return { ok: false, reason: "URL host is not allowed" };
    }
    if (parsed.username || parsed.password) return { ok: false, reason: "URL credentials are not allowed" };
    return { ok: true, url: parsed.toString() };
  } catch {
    return { ok: false, reason: "URL is invalid" };
  }
}
