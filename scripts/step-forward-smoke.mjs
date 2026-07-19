/**
 * Playwright — agentic CJM manual step-forward through full playlist.
 * Usage: node scripts/step-forward-smoke.mjs
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = process.env.PROTO_SMOKE_URL ?? "http://localhost:5173";
const outDir = path.join(__dirname, "playwright-out");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(600_000);

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });

  const stepForward = await page.evaluate(async () => {
    return window.__protoRunAgenticStepForwardSmoke?.({ timeoutMs: 600_000 });
  });

  const diagnosticText = await page.evaluate(() => {
    const el = document.querySelector(".studio-playback-diagnostic");
    return el?.textContent?.slice(0, 500) ?? null;
  });

  const report = { baseUrl, at: new Date().toISOString(), stepForward, diagnosticText };
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "step-forward-report.json"),
    JSON.stringify(report, null, 2)
  );

  console.log(JSON.stringify(report, null, 2));
  await browser.close();

  if (!stepForward?.pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
