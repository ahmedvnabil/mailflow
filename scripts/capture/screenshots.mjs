// Captures full-page retina PNGs of the running local MailFlow app, in both languages.
// Output: landing/assets/screenshots/{en,ar}/{dashboard,emails,search,ticket,outbound,attachments}.png
//
// Pre-req: `npm run dev` is up on BASE (default http://127.0.0.1:8788),
// migrations applied, and at least one ticket exists at /tickets/1.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const BASE = process.env.BASE || "http://127.0.0.1:8788";
const KEY = process.env.KEY || "dev-admin-key";
const OUT = "landing/assets/screenshots";

const PAGES = [
  { name: "dashboard", path: "/" },
  { name: "emails", path: "/emails" },
  { name: "search", path: "/search?q=invoice", wait: 600 },
  { name: "ticket", path: "/tickets/1" },
  { name: "outbound", path: "/outbound" },
  { name: "attachments", path: "/attachments" }
];

async function login(context) {
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="token"]', KEY);
  await Promise.all([page.waitForLoadState("networkidle"), page.locator("form button").click()]);
  await page.close();
}

async function captureLang(browser, lang) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  });
  await login(context);
  await context.addCookies([{ name: "mf_lang", value: lang, url: BASE }]);

  const outDir = join(OUT, lang);
  await mkdir(outDir, { recursive: true });

  for (const p of PAGES) {
    const page = await context.newPage();
    await page.goto(`${BASE}${p.path}`, { waitUntil: "networkidle" });
    if (p.wait) await page.waitForTimeout(p.wait);
    await page.waitForTimeout(400);
    const dest = join(outDir, `${p.name}.png`);
    await page.screenshot({ path: dest, fullPage: true });
    console.log(`  ${lang}/${p.name}.png`);
    await page.close();
  }
  await context.close();
}

(async () => {
  const browser = await chromium.launch();
  try {
    console.log("EN:");
    await captureLang(browser, "en");
    console.log("AR:");
    await captureLang(browser, "ar");
  } finally {
    await browser.close();
  }
})();
