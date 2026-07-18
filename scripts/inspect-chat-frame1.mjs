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
await page.locator(".proto-nav-tabs button").filter({ hasText: /Site Pilot\. Chat/i }).click();
await page.waitForTimeout(1000);

// Jump to first frame
await page.locator(".proto-nav-scenario__btn").first().click();
await page.waitForTimeout(800);

const report = await page.evaluate(() => {
  const screen = document.querySelector(".proto-viewport > div > div:nth-child(10)");
  const body = screen?.querySelector('[data-name="body"]');
  const scrollEl = document.querySelector(".proto-scroll--prototype:not(.hidden)");
  const summary = screen?.querySelector('[data-name="component.appointment.summary"]');
  const frames = summary ? Array.from(summary.children) : [];

  const cs = (el) => (el ? getComputedStyle(el) : null);
  const rect = (el) => (el ? el.getBoundingClientRect() : null);

  return {
    counter: document.querySelector(".proto-nav-scenario__counter")?.textContent,
    scroll: {
      top: scrollEl?.scrollTop,
      clientH: scrollEl?.clientHeight,
      scrollH: scrollEl?.scrollHeight,
      minH: cs(scrollEl)?.getPropertyValue("--proto-scroll-min-px"),
    },
    screen: {
      className: screen?.className,
      h: rect(screen)?.height,
      minH: cs(screen)?.minHeight,
      bg: cs(body)?.backgroundColor,
    },
    body: {
      h: rect(body)?.height,
      minH: cs(body)?.minHeight,
      overflow: cs(body)?.overflow,
    },
    bodyInner: {
      h: rect(body?.firstElementChild)?.height,
      minH: cs(body?.firstElementChild)?.minHeight,
      overflow: cs(body?.firstElementChild)?.overflow,
    },
    frames: frames.map((el, i) => ({
      i,
      display: cs(el).display,
      opacity: cs(el).opacity,
      maxH: cs(el).maxHeight,
      h: rect(el).height,
      hidden: el.classList.contains("proto-scenario-frame--hidden"),
      transition: cs(el).transitionDuration,
      visible: el.dataset.protoScenarioVisible,
    })),
  };
});

writeFileSync(join(OUT, "frame1-report.json"), JSON.stringify(report, null, 2));
await page.screenshot({ path: join(OUT, "frame1.png"), fullPage: false });
console.log(JSON.stringify(report, null, 2));
await browser.close();
