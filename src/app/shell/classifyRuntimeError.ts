export type RuntimeErrorHint = {
  id: string;
  title: string;
  summary: string;
  likelyCauses: string[];
  tryThese: string[];
};

const DEFAULT_HINT: RuntimeErrorHint = {
  id: "unknown",
  title: "Something crashed at runtime",
  summary:
    "The prototype hit an unexpected error while starting or rendering. The technical message below is the best clue.",
  likelyCauses: [
    "A recent code change introduced a bug in a component or hook.",
    "Browser cache is serving an older bundle alongside new code.",
  ],
  tryThese: [
    "Hard-refresh the page (Ctrl+Shift+R).",
    "Restart the dev server: npm run dev.",
    "Open DevTools → Console and read the first red error line.",
    "Check your latest edits (especially App.tsx, wire view, playback hooks).",
  ],
};

function errorText(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { name: "Error", message: String(error) };
}

/** Map common Vite/React runtime failures to plain-language hints for the studio shell. */
export function classifyRuntimeError(error: unknown): RuntimeErrorHint {
  const { name, message } = errorText(error);
  const text = `${name}: ${message}`;

  const missingRef = message.match(/^(\w+) is not defined$/);
  if (name === "ReferenceError" && missingRef) {
    const symbol = missingRef[1];
    const looksLikeHook = /^use[A-Z]/.test(symbol);
    const looksLikePlayback = /^(run|abort|simulate|exit|move)/i.test(symbol);
    return {
      id: "missing-reference",
      title: "Missing import or typo",
      summary: `JavaScript cannot find “${symbol}”. This usually means a symbol is used but never imported, or a bad merge deleted an import line.`,
      likelyCauses: [
        looksLikeHook
          ? `“${symbol}” looks like a React hook — check import { ${symbol} } from "…" in the file mentioned in the stack.`
          : looksLikePlayback
            ? `“${symbol}” looks like a playback helper — check imports in App.tsx, journey/scenario hooks, or playback scripts.`
            : `“${symbol}” is referenced without being defined in scope.`,
        "A search-replace or merge conflict may have removed an import while leaving the usage.",
        "Vite still builds successfully — missing imports often only fail in the browser.",
      ],
      tryThese: [
        "Search the repo for where “" + symbol + "” is used and verify the import at the top of that file.",
        "Check App.tsx and BootsPharmacyProjectView.tsx first — they orchestrate most of the shell.",
        "Hard-refresh after fixing (Ctrl+Shift+R).",
      ],
    };
  }

  const tdz = message.match(/^Cannot access '([^']+)' before initialization$/);
  if (name === "ReferenceError" && tdz) {
    const symbol = tdz[1];
    return {
      id: "temporal-dead-zone",
      title: "Used before it was declared",
      summary: `“${symbol}” is referenced before its const/let definition runs. This often blanks the entire page on first render.`,
      likelyCauses: [
        `A useCallback/useMemo lists “${symbol}” in its dependency array but is declared above “${symbol}”.`,
        "A helper was moved higher in the file without moving everything it depends on.",
        "Circular imports between modules (less common, but possible).",
      ],
      tryThese: [
        `Move the definition of “${symbol}” above the hook or callback that references it.`,
        "Or inline the dependency and remove it from an early useCallback deps array.",
        "Restart dev server after reordering declarations.",
      ],
    };
  }

  if (/is not a function/i.test(message)) {
    const fn = message.match(/(\w+) is not a function/)?.[1];
    return {
      id: "not-a-function",
      title: "Wrong import shape",
      summary: fn
        ? `“${fn}” was imported incorrectly — it is undefined or not callable.`
        : "Something expected a function but received undefined or an object.",
      likelyCauses: [
        "Named vs default export mismatch (import Foo vs import { Foo }).",
        "Importing from the wrong module path or a type-only export.",
        "Barrel file (index.ts) re-export is missing or wrong.",
      ],
      tryThese: [
        "Open the source module and match import style to how it is exported.",
        "Use your editor’s “Go to definition” on the symbol.",
      ],
    };
  }

  if (/Failed to fetch dynamically imported module/i.test(text)) {
    return {
      id: "chunk-load",
      title: "Stale or broken dev bundle",
      summary:
        "The browser tried to load a JavaScript chunk that no longer exists — common when the dev server restarted or ports changed.",
      likelyCauses: [
        "Multiple Vite dev servers running on different ports.",
        "Hot reload left the tab on an old module graph.",
      ],
      tryThese: [
        "Hard-refresh (Ctrl+Shift+R).",
        "Stop all npm run dev processes and start a single fresh server.",
        "Use the URL printed in the terminal (e.g. localhost:5173).",
      ],
    };
  }

  if (/Invalid hook call/i.test(message)) {
    return {
      id: "invalid-hook",
      title: "Invalid React hook call",
      summary:
        "A React hook was called outside a component, or two copies of React are loaded.",
      likelyCauses: [
        "Hook called at module top-level instead of inside a function component.",
        "Duplicate react packages in node_modules (rare after dependency changes).",
      ],
      tryThese: [
        "Find the hook named in the stack trace and ensure it is only called inside components or custom hooks.",
        "Run npm install and restart the dev server.",
      ],
    };
  }

  if (/Maximum update depth exceeded/i.test(message)) {
    return {
      id: "infinite-render",
      title: "Infinite render loop",
      summary:
        "A component keeps calling setState during render or in an effect without stable dependencies.",
      likelyCauses: [
        "useEffect missing a dependency array or setting state unconditionally.",
        "A parent passes a new object/function every render that retriggers a child effect.",
      ],
      tryThese: [
        "Check the component in the stack trace for useEffect + setState patterns.",
        "Stabilize callbacks with useCallback or move state updates behind guards.",
      ],
    };
  }

  if (/Cannot read properties of undefined/i.test(message) || /Cannot read properties of null/i.test(message)) {
    return {
      id: "null-access",
      title: "Unexpected empty value",
      summary:
        "Code assumed an object existed but it was undefined or null — often wire API or refs not ready yet.",
      likelyCauses: [
        "wireApiRef.current used before BootsPharmacyProjectView mounted.",
        "Optional chaining missing on nested studio/orchestra data.",
        "Race between playback start and DOM readiness.",
      ],
      tryThese: [
        "Read the stack trace for the exact property access.",
        "Add optional chaining or an early return until refs are populated.",
      ],
    };
  }

  return DEFAULT_HINT;
}

export function formatRuntimeErrorDetails(error: unknown): string {
  const { name, message, stack } = errorText(error);
  if (stack) return stack;
  return `${name}: ${message}`;
}
