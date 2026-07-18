import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.locator(".proto-nav-tabs button").filter({ hasText: /Site Pilot\. Chat/i }).click();
await page.waitForTimeout(1200);

// Jump to frame 1
await page.locator(".proto-nav-scenario__deck .proto-nav-scenario__btn").first().click();
await page.waitForTimeout(600);
// Step to frame 2
await page.locator(".proto-nav-scenario__deck .proto-nav-scenario__btn").nth(3).click();
await page.waitForTimeout(600);

const metrics = await page.evaluate(() => {
  const scroll = document.querySelector(".proto-scroll--prototype:not(.hidden)");
  const frames = Array.from(
    document.querySelectorAll(
      '.proto-viewport > div > div:nth-child(10) .proto-scenario-frame:not(.proto-scenario-frame--hidden)'
    )
  );
  return {
    scroll: scroll
      ? {
          clientHeight: scroll.clientHeight,
          scrollHeight: scroll.scrollHeight,
          scrollTop: scroll.scrollTop,
          max: scroll.scrollHeight - scroll.clientHeight,
          canScroll: scroll.scrollHeight > scroll.clientHeight + 1,
        }
      : null,
    frames: frames.map((f, i) => {
      const style = getComputedStyle(f);
      return {
        i: i + 1,
        offsetHeight: f.offsetHeight,
        scrollHeight: f.scrollHeight,
        overflow: style.overflow,
        maxHeight: style.maxHeight,
      };
    }),
  };
});

console.log(JSON.stringify(metrics, null, 2));

// Try manual scroll
await page.evaluate(() => {
  const el = document.querySelector(".proto-scroll--prototype:not(.hidden)");
  if (el) el.scrollTop = 200;
});
const after = await page.evaluate(() => {
  const el = document.querySelector(".proto-scroll--prototype:not(.hidden)");
  return el?.scrollTop;
});
console.log("After setting scrollTop=200:", after);

await browser.close();
