import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const OUT = join(process.cwd(), "scripts", "playwright-out");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const chatTab = page.locator(".proto-nav-tabs button").filter({ hasText: /Site Pilot\. Chat/i });
await chatTab.click();
await page.waitForTimeout(1500);

const report = await page.evaluate(() => {
  const scrollEl = document.querySelector(".proto-scroll--prototype:not(.hidden)");
  const dock = document.querySelector(".proto-chat-composer-dock--portal");
  const summary = document.querySelector(
    '.proto-viewport > div > div:nth-child(10) [data-name="component.appointment.summary"]'
  );
  const frames = summary
    ? Array.from(summary.children).filter((el) => el instanceof HTMLElement)
    : [];

  const dockRect = dock?.getBoundingClientRect();
  const scrollRect = scrollEl?.getBoundingClientRect();

  const frameVis = frames.map((el, i) => {
    const r = el.getBoundingClientRect();
    const inViewport =
      r.bottom > (scrollRect?.top ?? 0) &&
      r.top < (dockRect?.top ?? window.innerHeight) &&
      r.height > 0 &&
      getComputedStyle(el).display !== "none";
    return {
      i,
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      h: Math.round(r.height),
      inViewportAboveComposer: inViewport,
      text: (el.textContent ?? "").slice(0, 40).replace(/\s+/g, " "),
    };
  });

  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    dockTop: dockRect ? Math.round(dockRect.top) : null,
    dockH: dockRect ? Math.round(dockRect.height) : null,
    scrollTop: scrollEl?.scrollTop,
    scrollMax: (scrollEl?.scrollHeight ?? 0) - (scrollEl?.clientHeight ?? 0),
    framesInView: frameVis.filter((f) => f.inViewportAboveComposer),
    framesAboveComposer: frameVis.filter(
      (f) => f.bottom <= (dockRect?.top ?? 9999) && f.h > 0
    ),
    allFrames: frameVis,
  };
});

writeFileSync(join(OUT, "viewport-report.json"), JSON.stringify(report, null, 2));
await page.screenshot({ path: join(OUT, "chat-viewport.png"), fullPage: true });

console.log("Dock top:", report.dockTop, "scrollTop:", report.scrollTop, "max:", report.scrollMax);
console.log("Frames in viewport above composer:", report.framesInView.length);
console.log("Indices in view:", report.framesInView.map((f) => f.i));
console.log("Frames fully above composer:", report.framesAboveComposer.map((f) => f.i));

await browser.close();
