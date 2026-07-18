/**
 * Playwright smoke — agentic CJM home play handoff + retreat helper checks.
 * Usage: npm run smoke (starts dev server separately, or set PROTO_SMOKE_URL)
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

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });

  const baseline = await page.evaluate(() => window.__protoSmokeRetreatChecks?.());
  if (!baseline?.pass) {
    throw new Error(
      `__protoSmokeRetreatChecks failed: ${JSON.stringify(baseline?.checks?.filter((c) => !c.pass))}`
    );
  }

  const homePlay = await page.evaluate(async () => {
    return window.__protoRunHomePlaySmoke?.({ timeoutMs: 30_000 });
  });

  const diagnosticOpen = await page.evaluate(
    () => document.querySelector(".proto-playback-diagnostic") != null
  );

  const report = {
    baseUrl,
    at: new Date().toISOString(),
    baseline,
    homePlay,
    diagnosticOpen,
    pass: Boolean(homePlay?.pass) && !diagnosticOpen,
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "proto-smoke-report.json"),
    JSON.stringify(report, null, 2)
  );

  console.log(JSON.stringify(report, null, 2));
  await browser.close();

  if (!report.pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
