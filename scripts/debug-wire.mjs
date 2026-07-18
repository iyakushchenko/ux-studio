import fs from "fs";
const lines = fs.readFileSync("src/app/App.tsx", "utf8").split(/\r?\n/);
let componentBody = lines.slice(836, 4753).join("\n");
componentBody = componentBody.replace(/^export default function App\(\) \{/, "HEADER");
const removals = [
  /  const studio = useProtoStudio\(\);[\s\S]*?  \} = studio;\n\n/,
  /  const \{\n    PROTO_SCREENS: SCREENS,[\s\S]*?  \} = projectContent;\n\n/,
  /  const journeyRuntime = useMemo[\s\S]*?  \);\n\n/,
  /  const activeScreenScenario = useMemo[\s\S]*?  \);\n\n/,
  /  const journeyBeatIndexRef = useRef[\s\S]*?activeJourneyRef\.current = activeJourney;\n/,
  /  const scenarioIsPlayingRef = useRef[\s\S]*?resumeJourneyPlayRef\.current[\s\S]*?;\n\n/,
  /  const collectScenarioFrames = useCallback[\s\S]*?  \);\n\n/,
  /  const sitePilotChatPlaybackHooks = useMemo[\s\S]*?  \);\n\n/,
  /  const scenarioPlayback = useProtoScenarioPlayback\([\s\S]*?  \);\n\n/,
  /  const headerLoggedIn = loggedInFlag \|\| isProtoHeaderLoggedIn\(\);\n\n/,
  /  const shouldSkipBeat = useMemo[\s\S]*?  \);\n\n/,
  /  const journeyPlayback = useProtoJourneyPlayback\([\s\S]*?  \);\n\n/,
  /  const transport = journeyPlayback;\n  const navPlaybackLocked[\s\S]*?navPlaybackLockedRef\.current = navPlaybackLocked;\n\n/,
  /  const \[current, setCurrent\] = useState\(readInitialNavIndex\);\n/,
  /  const \[hubOpen, setHubOpen\] = useState\([\s\S]*?\);\n/,
];
for (const re of removals) {
  const before = componentBody.length;
  componentBody = componentBody.replace(re, "");
  if (componentBody.length !== before) {
    console.log("matched", String(re).slice(0, 70), "delta", before - componentBody.length);
  }
}
console.log("availability idx", componentBody.indexOf("availabilityOpen"));
console.log(componentBody.slice(0, 1200));
