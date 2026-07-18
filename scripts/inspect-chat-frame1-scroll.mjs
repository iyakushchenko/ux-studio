import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference",
});

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.locator(".proto-nav-tabs button").filter({ hasText: /Site Pilot\. Chat/i }).click();

const read = () =>
  page.evaluate(() => {
    const el = document.querySelector(".proto-scroll--prototype:not(.hidden)");
    const max = el ? el.scrollHeight - el.clientHeight : 0;
    return {
      top: el?.scrollTop ?? 0,
      max,
      atTop: (el?.scrollTop ?? 0) < 4,
      atBottom: el ? Math.abs(el.scrollTop - max) < 4 : false,
    };
  });

// Initial load (last frame) — should not sit at top showing first bubble
const initTimeline = [];
for (let ms = 0; ms <= 400; ms += 50) {
  if (ms) await page.waitForTimeout(50);
  initTimeline.push({ ms, ...(await read()) });
}
console.log("Initial load (first 400ms):");
for (const t of initTimeline) {
  console.log(`  ${t.ms}ms: top=${t.top} atTop=${t.atTop} atBottom=${t.atBottom}`);
}

await page.waitForTimeout(900);
const afterInit = await read();
console.log("After init settle:", afterInit);

// Jump to frame 1 from full thread
await page.locator(".proto-nav-scenario__deck .proto-nav-scenario__btn").first().click();

const jumpTimeline = [{ ms: 0, ...(await read()) }];
for (let ms = 50; ms <= 900; ms += 50) {
  await page.waitForTimeout(50);
  jumpTimeline.push({ ms, ...(await read()) });
}

console.log("Jump to frame 1 timeline:");
for (const t of jumpTimeline) {
  console.log(`  ${t.ms}ms: top=${t.top} atTop=${t.atTop}`);
}
console.log("PASS frame 1 at top?", jumpTimeline[jumpTimeline.length - 1].atTop);

await browser.close();
