import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.locator(".studio-nav-tabs button").filter({ hasText: /Site Pilot\. Chat/i }).click();
await page.waitForTimeout(1200);

const scrollEl = page.locator(".studio-scroll--prototype:not(.hidden)");
const before = await scrollEl.evaluate((el) => el.scrollTop);
await scrollEl.evaluate((el) => { el.scrollTop = 0; });
await page.waitForTimeout(300);
const after = await scrollEl.evaluate((el) => el.scrollTop);
const stuck = await page.evaluate(() => {
  const el = document.querySelector(".studio-scroll--prototype:not(.hidden)");
  return { top: el?.scrollTop, max: (el?.scrollHeight ?? 0) - (el?.clientHeight ?? 0) };
});
console.log("Before manual scroll up:", before, "After scrollTop=0:", after, "500ms later:", stuck);
await browser.close();
