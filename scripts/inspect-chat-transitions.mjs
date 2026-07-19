import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference",
});
await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.locator(".studio-nav-tabs button").filter({ hasText: /Site Pilot\. Chat/i }).click();
await page.waitForTimeout(1200);

await page.locator(".studio-nav-scenario__btn").first().click();
await page.waitForTimeout(600);
const counter1 = await page.locator(".studio-nav-scenario__counter").textContent();
console.log("After jump to start:", counter1);

const stepFwd = page.locator(".studio-nav-scenario__deck .studio-nav-scenario__btn").nth(3);
await stepFwd.click();

const samples = [];
for (const delay of [0, 30, 80, 150, 250, 400]) {
  if (delay) await page.waitForTimeout(delay - (samples.length ? samples[samples.length - 1].delay : 0));
  const sample = await page.evaluate(() => {
    const f1 = document.querySelector(
      '.studio-viewport > div > div:nth-child(10) [data-name="component.appointment.summary"] > .proto-scenario-frame[data-studio-scenario-frame="2"]'
    );
    if (!f1) return null;
    const cs = getComputedStyle(f1);
    return {
      opacity: cs.opacity,
      maxH: cs.maxHeight,
      hidden: f1.classList.contains("proto-scenario-frame--hidden"),
      transition: cs.transitionDuration,
      display: cs.display,
      h: f1.getBoundingClientRect().height,
    };
  });
  samples.push({ delay, sample });
}

console.log("Frame 2 samples during step forward from 1/9:");
console.log(JSON.stringify(samples, null, 2));

const animated = samples.some(
  (s, i) => i > 0 && s.sample && samples[0].sample && s.sample.opacity !== samples[0].sample.opacity
);
console.log("Opacity animated?", animated);

await browser.close();
