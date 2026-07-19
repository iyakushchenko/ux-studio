/**
 * Playwright smoke — CI runs lean profile; full marathon is opt-in.
 * Usage:
 *   npm run smoke              # lean (CI default)
 *   PROTO_SMOKE_PROFILE=full npm run smoke
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = process.env.PROTO_SMOKE_URL ?? "http://localhost:5173";
const outDir = path.join(__dirname, "playwright-out");
const evaluateTimeoutMs = 600_000;
const profile = process.env.PROTO_SMOKE_PROFILE ?? "ci";
const isFull = profile === "full" || process.env.PROTO_SMOKE_FULL === "1";

async function dismissAndClean(page) {
  await page.evaluate(() => {
    window.__protoDismissPlaybackDiagnostic?.();
    window.__protoEnsureCleanStudio?.();
  });
  await page.waitForTimeout(400);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(evaluateTimeoutMs);

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await page.evaluate(() => window.__protoAbortAll?.());
  await dismissAndClean(page);

  const sanity = await page.evaluate(async () =>
    window.__protoRunMcpSanityCheck?.()
  );

  const baseline = await page.evaluate(() => window.__protoSmokeRetreatChecks?.());
  if (!baseline?.pass) {
    throw new Error(
      `__protoSmokeRetreatChecks failed: ${JSON.stringify(baseline?.checks?.filter((c) => !c.pass))}`
    );
  }

  await dismissAndClean(page);
  const homePlay = isFull
    ? await page.evaluate(async () =>
        window.__protoRunHomePlaySmoke?.({ timeoutMs: 30_000 })
      )
    : { pass: true, skipped: true };

  await dismissAndClean(page);
  const retreat = await page.evaluate(async () =>
    window.__protoRunRetreatSmoke?.({ timeoutMs: 90_000 })
  );

  let stepForward;
  let traditionalStepForward;
  let traditionalRetreat;

  if (isFull) {
    await dismissAndClean(page);
    stepForward = await page.evaluate(async () =>
      window.__protoRunAgenticStepForwardSmoke?.({ timeoutMs: 240_000 })
    );

    await dismissAndClean(page);
    traditionalStepForward = await page.evaluate(async () =>
      window.__protoRunTraditionalStepForwardSmoke?.({ timeoutMs: 360_000 })
    );

    await dismissAndClean(page);
    traditionalRetreat = await page.evaluate(async () =>
      window.__protoRunTraditionalRetreatSmoke?.({ timeoutMs: 120_000 })
    );
  }

  const diagnosticOpen = await page.evaluate(
    () => document.querySelector(".proto-playback-diagnostic") != null
  );

  const report = {
    baseUrl,
    profile,
    at: new Date().toISOString(),
    sanity,
    baseline,
    homePlay,
    retreat,
    stepForward: stepForward ?? { skipped: true },
    traditionalStepForward: traditionalStepForward ?? { skipped: true },
    traditionalRetreat: traditionalRetreat ?? { skipped: true },
    diagnosticOpen,
    pass:
      Boolean(sanity?.pass) &&
      Boolean(baseline?.pass) &&
      Boolean(retreat?.pass) &&
      (isFull ? Boolean(homePlay?.pass) : true) &&
      (isFull
        ? Boolean(stepForward?.pass) &&
          Boolean(traditionalStepForward?.pass) &&
          Boolean(traditionalRetreat?.pass)
        : true) &&
      !diagnosticOpen,
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "proto-smoke-report.json"),
    JSON.stringify(report, null, 2)
  );

  console.log(JSON.stringify(report, null, 2));
  await browser.close();

  if (!report.pass) {
    if (!sanity?.pass) console.error("sanity failed");
    if (isFull && !homePlay?.pass) console.error("homePlay failed:", homePlay?.reason);
    if (!retreat?.pass) {
      console.error(
        "retreat failed:",
        retreat?.checks?.filter((c) => !c.pass)
      );
    }
    if (isFull && !stepForward?.pass) {
      console.error("stepForward failed:", stepForward?.reason);
    }
    if (isFull && !traditionalStepForward?.pass) {
      console.error("traditionalStepForward failed:", traditionalStepForward?.reason);
    }
    if (isFull && !traditionalRetreat?.pass) {
      console.error(
        "traditionalRetreat failed:",
        traditionalRetreat?.checks?.filter((c) => !c.pass)
      );
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
