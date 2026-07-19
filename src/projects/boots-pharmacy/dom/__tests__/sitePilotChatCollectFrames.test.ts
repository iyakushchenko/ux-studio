/** @vitest-environment happy-dom */
import { describe, expect, it } from "vitest";
import { collectSitePilotChatScenarioFrames } from "@/projects/boots-pharmacy/dom/sitePilotChatScenario";

describe("collectSitePilotChatScenarioFrames", () => {
  it("prefers React host summary over Make dump-all under page react attr", () => {
    const page = document.createElement("div");
    page.dataset.studioReactScreen = "chat";

    const makeBody = document.createElement("div");
    makeBody.dataset.studioMakeRetired = "chat";
    makeBody.style.display = "none";
    const makeSummary = document.createElement("div");
    makeSummary.setAttribute("data-name", "component.appointment.summary");
    for (const name of ["query", "reply", "query", "reply"]) {
      const f = document.createElement("div");
      f.setAttribute("data-name", name);
      // Sparse stamps that used to poison collect → 2-frame collapse.
      if (name === "reply") f.setAttribute("data-studio-chat-frame", "r0");
      makeSummary.appendChild(f);
    }
    makeBody.appendChild(makeSummary);
    page.appendChild(makeBody);

    const host = document.createElement("div");
    host.className = "studio-react-screen-host";
    host.dataset.studioReactScreen = "chat";
    const reactSummary = document.createElement("div");
    reactSummary.className = "chat__summary";
    reactSummary.setAttribute("data-name", "component.appointment.summary");
    for (const id of ["q0", "r0", "q1", "r1", "q2", "r2", "q3", "r3"]) {
      const f = document.createElement("div");
      f.setAttribute("data-studio-chat-frame", id);
      f.setAttribute("data-name", id.startsWith("q") ? "query" : "reply");
      reactSummary.appendChild(f);
    }
    host.appendChild(reactSummary);
    page.appendChild(host);

    document.body.appendChild(page);
    const frames = collectSitePilotChatScenarioFrames(page);
    expect(frames.map((f) => f.getAttribute("data-studio-chat-frame"))).toEqual([
      "q0",
      "r0",
      "q1",
      "r1",
      "q2",
      "r2",
      "q3",
      "r3",
    ]);
    page.remove();
  });

  it("does not short-circuit Make dump-all on sparse data-studio-chat-frame stamps", () => {
    const page = document.createElement("div");
    const summary = document.createElement("div");
    summary.setAttribute("data-name", "component.appointment.summary");
    const ids = ["q0", "r0", "q1", "r1", "q2", "r2", "q3", "r3"];
    ids.forEach((id, i) => {
      const f = document.createElement("div");
      f.setAttribute("data-name", id.startsWith("q") ? "query" : "reply");
      // Only two stamped — must still collect all query/reply children.
      if (i < 2) f.setAttribute("data-studio-chat-frame", id);
      summary.appendChild(f);
    });
    page.appendChild(summary);
    document.body.appendChild(page);

    const frames = collectSitePilotChatScenarioFrames(page);
    expect(frames).toHaveLength(8);
    page.remove();
  });
});
