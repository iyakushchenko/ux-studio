import type { KeyboardEvent } from "react";

export type BookProgressStepState = "upcoming" | "current" | "completed";

export type BookProgressStep = {
  n: number;
  label: string;
  state: BookProgressStepState;
  /** Completed step clickable as back (e.g. Step 1 from Step 2). */
  onActivate?: () => void;
};

export type BookAppointmentProgressProps = {
  steps: readonly BookProgressStep[];
  className?: string;
  /** When false, progress is display-only (Confirmation). */
  interactive?: boolean;
};

export const BOOK_APPOINTMENT_PROGRESS_LABELS = [
  { n: 1, label: "Choose Location" },
  { n: 2, label: "Choose Date and Time" },
  { n: 3, label: "Confirmation" },
] as const;

/** Build the 3-step booking progress for the active screen (1–3). */
export function buildBookProgressSteps(
  activeStep: 1 | 2 | 3,
  options?: { onBackToStep1?: () => void; confirmationComplete?: boolean }
): BookProgressStep[] {
  const confirmationComplete = options?.confirmationComplete === true;
  return BOOK_APPOINTMENT_PROGRESS_LABELS.map(({ n, label }) => {
    let state: BookProgressStepState;
    if (confirmationComplete) {
      // Confirmation: prior steps completed; step 3 current (bold) + filled bar.
      state = n === 3 ? "current" : "completed";
    } else if (n < activeStep) {
      state = "completed";
    } else if (n === activeStep) {
      state = "current";
    } else {
      state = "upcoming";
    }
    const onActivate =
      n === 1 && state === "completed" && options?.onBackToStep1
        ? options.onBackToStep1
        : undefined;
    return { n, label, state, onActivate };
  });
}

/**
 * UXDS booking progress — `component.book.appointment.progress`.
 * Shared across Book Step 1 / 2 / 3 React screens.
 */
export function BookAppointmentProgress({
  steps,
  className,
  interactive = true,
}: BookAppointmentProgressProps) {
  return (
    <div
      className={["uxds-book-progress", className].filter(Boolean).join(" ")}
      data-name="component.book.appointment.progress"
      style={interactive ? undefined : { pointerEvents: "none" }}
    >
      {steps.map((step) => {
        const isActive = step.state === "current";
        const isCompleted = step.state === "completed";
        const canBack = Boolean(step.onActivate) && interactive;
        return (
          <div
            key={step.n}
            className={[
              "uxds-book-progress__step",
              isActive ? "is-active" : "",
              isCompleted ? "is-completed" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            {...(isActive
              ? { "data-studio-step-active": "true" as const }
              : {})}
            {...(canBack
              ? {
                  "data-studio-book-step-back": "true" as const,
                  role: "button" as const,
                  tabIndex: 0,
                  "aria-label": `Go back to ${step.label}`,
                  onClick: step.onActivate,
                  onKeyDown: (e: KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      step.onActivate?.();
                    }
                  },
                }
              : {})}
          >
            <ol start={step.n}>
              <li>
                <span>{step.label}</span>
              </li>
            </ol>
            <div
              className="uxds-book-progress__bar"
              data-studio-book-progress={
                isActive ? "current" : isCompleted ? "completed" : "upcoming"
              }
            />
          </div>
        );
      })}
    </div>
  );
}
