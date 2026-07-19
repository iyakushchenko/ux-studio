import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.locator(".studio-nav-tabs button").filter({ hasText: /Site Pilot\. Chat/i }).click();
await page.waitForTimeout(1200);

// Default 9/9 -> jump to 1 -> step to 2 (user-like path)
await page.locator(".studio-nav-scenario__deck .studio-nav-scenario__btn").first().click();
await page.waitForTimeout(700);
await page.locator(".studio-nav-scenario__deck .studio-nav-scenario__btn").nth(3).click();
await page.waitForTimeout(1000);

const before = await page.evaluate(() => {
  const el = document.querySelector(".studio-scroll--prototype:not(.hidden)");
  return { top: el?.scrollTop, max: el ? el.scrollHeight - el.clientHeight : 0 };
});
console.log("Before wheel:", before);

const scrollEl = page.locator(".studio-scroll--prototype:not(.hidden)");
await scrollEl.hover();
await page.mouse.wheel(0, -300);
await page.waitForTimeout(100);

const afterWheel = await page.evaluate(() => {
  const el = document.querySelector(".studio-scroll--prototype:not(.hidden)");
  return { top: el?.scrollTop, max: el ? el.scrollHeight - el.clientHeight : 0 };
});
console.log("After wheel up:", afterWheel);

// Also test path: play from 1 to 2
await page.reload({ waitUntil: "networkidle" });
await page.locator(".studio-nav-tabs button").filter({ hasText: /Site Pilot\. Chat/i }).click();
await page.waitForTimeout(1200);
await page.locator(".studio-nav-scenario__deck .studio-nav-scenario__btn").first().click();
await page.waitForTimeout(700);
await page.locator(".studio-nav-scenario__deck .studio-nav-scenario__btn").nth(3).click();
await page.waitForTimeout(1000);

const at2 = await page.evaluate(() => {
  const el = document.querySelector(".studio-scroll--prototype:not(.hidden)");
  return {
    top: el?.scrollTop,
    max: el ? el.scrollHeight - el.clientHeight : 0,
    canScroll: el ? el.scrollHeight > el.clientHeight + 1 : false,
  };
});
console.log("At 2/9:", at2);

await browser.close();
