/** @vitest-environment happy-dom */
import { describe, expect, it } from "vitest";
import { findReserveAppointmentButton } from "@/projects/boots-pharmacy/playback/book";

describe("findReserveAppointmentButton", () => {
  it("prefers React reserve button over Legacy retired div", () => {
    const screen = document.createElement("div");
    const legacyEl = document.createElement("div");
    legacyEl.dataset.studioLegacyRetired = "book-step-2";
    legacyEl.style.display = "none";
    const legacyBtn = document.createElement("div");
    legacyBtn.setAttribute("data-name", "component.input.button");
    legacyBtn.textContent = "Reserve Appointment";
    legacyEl.appendChild(legacyBtn);
    screen.appendChild(legacyEl);

    const reactBtn = document.createElement("button");
    reactBtn.setAttribute("data-studio-action", "book-step-2-reserve");
    reactBtn.className = "book-step-2__reserve";
    reactBtn.textContent = "Reserve Appointment";
    screen.appendChild(reactBtn);

    document.body.appendChild(screen);
    expect(findReserveAppointmentButton(screen)).toBe(reactBtn);
    screen.remove();
  });
});
