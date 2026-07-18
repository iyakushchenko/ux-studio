import { describe, expect, it, vi } from "vitest";

/**
 * Mirrors useProtoJourneyPlayback director beat chaining: scripting must stay
 * active until chained async work (e.g. select-book-time scroll) finishes.
 */
async function runDirectorBeatWithChain(options: {
  chain: () => Promise<boolean>;
  awaitChain: boolean;
}): Promise<boolean[]> {
  const active: boolean[] = [];
  const setActive = (value: boolean) => {
    active.push(value);
  };

  setActive(true);
  try {
    if (options.awaitChain) {
      await options.chain();
    } else {
      void options.chain();
    }
  } finally {
    setActive(false);
  }

  return active;
}

describe("director scripting lifecycle", () => {
  it("clears scripting before chained select-book-time work without await", async () => {
    let chainDone = false;
    const active = await runDirectorBeatWithChain({
      awaitChain: false,
      chain: async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        chainDone = true;
        return true;
      },
    });

    expect(active).toEqual([true, false]);
    expect(chainDone).toBe(false);
  });

  it("keeps scripting active until chained select-book-time work completes", async () => {
    let chainDone = false;
    const active: boolean[] = [];
    const setActive = (value: boolean) => {
      active.push(value);
    };

    setActive(true);
    try {
      await (async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        chainDone = true;
        return true;
      })();
    } finally {
      setActive(false);
    }

    expect(active).toEqual([true, false]);
    expect(chainDone).toBe(true);
  });

  it("covers playback scroll tail after scripting clears", async () => {
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback) => setTimeout(() => cb(0), 16) as unknown as number
    );
    vi.stubGlobal(
      "cancelAnimationFrame",
      (id: number) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>)
    );

    let scrollAnimating = true;
    let scrollBusy = false;
    let pollRaf: number | null = null;

    const pollUntilIdle = () => {
      if (pollRaf != null) cancelAnimationFrame(pollRaf);
      if (!scrollAnimating) {
        scrollBusy = false;
        return;
      }
      scrollBusy = true;
      const tick = () => {
        scrollBusy = scrollAnimating;
        if (scrollAnimating) {
          pollRaf = requestAnimationFrame(tick);
        } else {
          pollRaf = null;
        }
      };
      pollRaf = requestAnimationFrame(tick);
    };

    let scriptingActive = true;
    const setScriptingActive = (active: boolean) => {
      scriptingActive = active;
      if (!active) pollUntilIdle();
    };

    setScriptingActive(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(scriptingActive).toBe(false);
    expect(scrollBusy).toBe(true);

    scrollAnimating = false;
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(scrollBusy).toBe(false);

    vi.unstubAllGlobals();
  });
});
