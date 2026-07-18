import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference",
});

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.locator(".proto-nav-tabs button").filter({ hasText: /Site Pilot\. Chat/i }).click();
await page.waitForTimeout(1500);

const read = () =>
  page.evaluate(() => {
    const el = document.querySelector(".proto-scroll--prototype:not(.hidden)");
    const max = el ? el.scrollHeight - el.clientHeight : 0;
    return { top: el?.scrollTop ?? 0, max, atBottom: el ? Math.abs(el.scrollTop - max) < 4 : false };
  });

const start = await read();
await page.locator(".proto-nav-scenario__deck .proto-nav-scenario__btn").nth(1).click();

const timeline = [{ ms: 0, ...(await read()) }];
for (let ms = 50; ms <= 800; ms += 50) {
  await page.waitForTimeout(50);
  timeline.push({ ms, ...(await read()) });
}

console.log("Start at bottom?", start.atBottom, start);
console.log("Step back timeline:");
for (const t of timeline) {
  console.log(`  ${t.ms}ms: top=${t.top} max=${t.max} atBottom=${t.atBottom}`);
}
console.log(
  "PASS ends at bottom?",
  timeline[timeline.length - 1].atBottom
);

await browser.close();
