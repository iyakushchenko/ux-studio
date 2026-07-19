import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.locator(".studio-nav-tabs button").filter({ hasText: /Site Pilot\. Chat/i }).click();
await page.waitForTimeout(1200);
await page.locator(".studio-nav-scenario__deck .studio-nav-scenario__btn").first().click();
await page.waitForTimeout(600);
await page.locator(".studio-nav-scenario__deck .studio-nav-scenario__btn").nth(3).click();
await page.waitForTimeout(600);

const data = await page.evaluate(() => {
  const frame2 = document.querySelector(
    '.studio-viewport > div > div:nth-child(10) .proto-scenario-frame[data-studio-scenario-frame="2"]'
  );
  if (!frame2) return null;
  const inner = frame2.firstElementChild;
  return {
    frame: {
      offsetHeight: frame2.offsetHeight,
      scrollHeight: frame2.scrollHeight,
      overflow: getComputedStyle(frame2).overflow,
    },
    inner: inner
      ? {
          tag: inner.tagName,
          offsetHeight: inner.offsetHeight,
          scrollHeight: inner.scrollHeight,
        }
      : null,
    full9: null,
  };
});

// Compare with full thread frame 2
await page.locator(".studio-nav-scenario__deck .studio-nav-scenario__btn").last().click();
await page.waitForTimeout(800);

const full = await page.evaluate(() => {
  const frame2 = document.querySelector(
    '.studio-viewport > div > div:nth-child(10) .proto-scenario-frame[data-studio-scenario-frame="2"]'
  );
  return frame2
    ? { offsetHeight: frame2.offsetHeight, scrollHeight: frame2.scrollHeight }
    : null;
});

console.log("Frame 2 at 2/9:", data);
console.log("Frame 2 at 9/9:", full);

await browser.close();
