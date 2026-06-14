// Records a real screen capture of the dashboard→emails→search→ticket flow.
// Output: scripts/capture/.video/<sessionId>.webm  -> caller converts to gif+mp4
import { chromium } from "playwright";
import { mkdir, readdir, copyFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = process.env.BASE || "http://127.0.0.1:8788";
const KEY = process.env.KEY || "dev-admin-key";
const VIDEO_DIR = "scripts/capture/.video";

(async () => {
  await mkdir(VIDEO_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } }
  });

  // Login first (separate page, NOT recorded into the final video timeline meaningfully)
  const login = await context.newPage();
  await login.goto(`${BASE}/login`);
  await login.fill('input[name="token"]', KEY);
  await Promise.all([login.waitForLoadState("networkidle"), login.locator("form button").click()]);
  await login.close();
  await context.addCookies([{ name: "mf_lang", value: "en", url: BASE }]);

  const page = await context.newPage();
  const pause = (ms) => page.waitForTimeout(ms);

  // 1) Dashboard
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await pause(2500);

  // 2) Emails list
  await page.goto(`${BASE}/emails`, { waitUntil: "networkidle" });
  await pause(2500);

  // 3) Search — type a real query
  await page.goto(`${BASE}/search`, { waitUntil: "networkidle" });
  await pause(500);
  const searchInput = page.locator('input[type="search"], input[placeholder*="ابحث" i], input[placeholder*="search" i]').first();
  if (await searchInput.count()) {
    await searchInput.click();
    await page.keyboard.type("invoice", { delay: 90 });
    await pause(900);
  } else {
    await page.goto(`${BASE}/search?q=invoice`, { waitUntil: "networkidle" });
  }
  await pause(2500);

  // 4) Ticket detail — visit, then move toward reply composer
  await page.goto(`${BASE}/tickets/1`, { waitUntil: "networkidle" });
  await pause(2000);
  const replyArea = page.locator('textarea').first();
  if (await replyArea.count()) {
    await replyArea.click();
    await page.keyboard.type("Confirmed — net 30 from invoice date, payment scheduled for July 12.", { delay: 35 });
    await pause(1500);
  } else {
    await pause(1500);
  }

  await page.close();
  await context.close();
  await browser.close();

  // Find the produced .webm
  const files = (await readdir(VIDEO_DIR)).filter((f) => f.endsWith(".webm"));
  files.sort();
  const latest = files[files.length - 1];
  if (!latest) throw new Error("no .webm produced");
  const finalPath = join(VIDEO_DIR, "walkthrough.webm");
  await copyFile(join(VIDEO_DIR, latest), finalPath);
  console.log(finalPath);
})();
