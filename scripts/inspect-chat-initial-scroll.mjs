import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const OUT = join(process.cwd(), "scripts", "playwright-out");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference",
});

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
const t0 = Date.now();
await page.locator(".proto-nav-tabs button").filter({ hasText: /Site Pilot\. Chat/i }).click();

const timeline = [];
for (let ms = 0; ms <= 2000; ms += 50) {
  if (ms > 0) await page.waitForTimeout(50);
  const state = await page.evaluate(() => {
    const el = document.querySelector(".proto-scroll--prototype:not(.hidden)");
    return {
      top: el?.scrollTop ?? null,
      max: el ? el.scrollHeight - el.clientHeight : null,
      counter: document.querySelector(".proto-nav-scenario__counter")?.textContent ?? null,
    };
  });
  timeline.push({ ms, ...state });
}

writeFileSync(join(OUT, "initial-scroll-timeline.json"), JSON.stringify(timeline, null, 2));

const at100 = timeline.find((t) => t.ms === 100);
const at650 = timeline.find((t) => t.ms === 650);
const at900 = timeline.find((t) => t.ms === 900);
console.log("Initial load scroll timeline:");
console.log("  100ms:", at100);
console.log("  650ms:", at650);
console.log("  900ms:", at900);
console.log(
  "PASS initial deferred?",
  at100?.top === 0 && (at650?.top ?? 0) < (at100?.max ?? 1) * 0.5
);

// Step back from 9/9 — scroll should lag behind hide
await page.waitForTimeout(500);
await page.locator(".proto-nav-scenario__deck .proto-nav-scenario__btn").nth(1).click();
const stepBack = [];
for (let ms = 0; ms <= 900; ms += 50) {
  if (ms > 0) await page.waitForTimeout(50);
  const el = await page.evaluate(() => {
    const scroll = document.querySelector(".proto-scroll--prototype:not(.hidden)");
    const f9 = document.querySelector(
      '.proto-viewport > div > div:nth-child(10) [data-name="component.appointment.summary"] > .proto-scenario-frame[data-proto-scenario-frame="9"]'
    );
    return {
      top: scroll?.scrollTop ?? null,
      f9Opacity: f9 ? getComputedStyle(f9).opacity : null,
      f9H: f9?.getBoundingClientRect().height ?? null,
      counter: document.querySelector(".proto-nav-scenario__counter")?.textContent,
    };
  });
  stepBack.push({ ms, ...el });
}

const sb0 = stepBack.find((t) => t.ms === 0);
const sb400 = stepBack.find((t) => t.ms === 400);
const sb700 = stepBack.find((t) => t.ms === 700);
console.log("\nStep back timeline:");
console.log("  0ms:", sb0);
console.log("  400ms:", sb400);
console.log("  700ms:", sb700);
console.log(
  "PASS scroll lags hide?",
  Number(sb400?.f9Opacity ?? 1) < 0.5 && (sb700?.top ?? 0) < (sb0?.top ?? 0)
);

await browser.close();
