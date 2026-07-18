import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const OUT = join(process.cwd(), "scripts", "playwright-out");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

// Tab 2 = Site Pilot Chat (current index 1)
const chatTab = page.locator(".proto-nav-tabs button").filter({ hasText: /Site Pilot\. Chat/i });
await chatTab.click();
await page.waitForTimeout(1200);

const report = await page.evaluate(() => {
  const screen = document.querySelector(".proto-viewport > div > div:nth-child(10)");
  const summary = screen?.querySelector('[data-name="component.appointment.summary"]');
  const children = summary ? Array.from(summary.children) : [];
  const scrollEl = document.querySelector(".proto-scroll--prototype:not(.hidden)");

  const frames = children.map((el, i) => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      i,
      tag: el.tagName,
      name: el.getAttribute("data-name") ?? el.className.slice(0, 40),
      display: style.display,
      opacity: style.opacity,
      maxHeight: style.maxHeight,
      hiddenClass: el.classList.contains("proto-scenario-frame--hidden"),
      scenarioVisible: el.dataset.protoScenarioVisible,
      rectH: Math.round(rect.height),
      rectTop: Math.round(rect.top),
      text: (el.textContent ?? "").slice(0, 60).replace(/\s+/g, " "),
    };
  });

  const counter = document.querySelector(".proto-nav-scenario__counter")?.textContent?.trim();
  const visibleFrames = frames.filter(
    (f) => f.display !== "none" && !f.hiddenClass && f.rectH > 0
  );

  return {
    counter,
    totalChildren: children.length,
    visibleFrameCount: visibleFrames.length,
    scrollTop: scrollEl?.scrollTop ?? null,
    scrollHeight: scrollEl?.scrollHeight ?? null,
    clientHeight: scrollEl?.clientHeight ?? null,
    composerPad: screen?.style.getPropertyValue("--proto-chat-composer-h"),
    frames,
    visibleFrames: visibleFrames.map((f) => ({ i: f.i, name: f.name, text: f.text })),
  };
});

writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
await page.screenshot({ path: join(OUT, "chat-initial.png"), fullPage: false });

console.log("SCENARIO COUNTER:", report.counter);
console.log("CHILDREN:", report.totalChildren, "VISIBLE:", report.visibleFrameCount);
console.log("SCROLL:", report.scrollTop, "/", report.scrollHeight - report.clientHeight);
console.log("VISIBLE FRAMES:", report.visibleFrames);
console.log("Screenshot:", join(OUT, "chat-initial.png"));

await browser.close();
