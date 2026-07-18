import { useEffect, useState, type MouseEvent } from "react";
import { ProtoCloseIcon } from "@/app/chrome/ProtoCloseIcon";

export type RecipientMode = "myself" | "someone-else";

const RECIPIENT_LABELS: Record<RecipientMode, string> = {
  myself: "Myself",
  "someone-else": "Someone else",
};

type Props = {
  open: boolean;
  selected: RecipientMode;
  onClose: () => void;
  onSelect: (mode: RecipientMode) => void;
};

export function recipientModeLabel(mode: RecipientMode): string {
  return RECIPIENT_LABELS[mode];
}

function RecipientDisclaimer({ mode }: { mode: RecipientMode }) {
  const context =
    mode === "myself"
      ? "You are booking this vaccination for yourself."
      : "You are booking this vaccination for someone else.";

  return (
    <div className="proto-recipient-picker__disclaimer">
      <p className="proto-recipient-picker__context">{context}</p>
      <p>Boots Account will be required to proceed.</p>
      <p className="proto-recipient-picker__links">
        <span className="proto-recipient-picker__link">Quick Sign In</span>
        <span className="proto-recipient-picker__or">or</span>
        <span className="proto-recipient-picker__link">Create Boots Account</span>
      </p>
    </div>
  );
}

export default function RecipientPickerPopup({
  open,
  selected,
  onClose,
  onSelect,
}: Props) {
  const [draft, setDraft] = useState<RecipientMode>(selected);

  useEffect(() => {
    if (open) setDraft(selected);
  }, [open, selected]);

  const onScrim = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const confirm = () => {
    onSelect(draft);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="proto-avail-scrim" role="presentation" onClick={onScrim}>
      <div
        className="proto-avail-card proto-recipient-picker-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="proto-recipient-picker-title"
      >
        <div className="proto-avail-header">
          <h2 id="proto-recipient-picker-title" className="proto-avail-title">
            Choose Recipient
          </h2>
          <button
            type="button"
            className="proto-popup-close"
            aria-label="Close recipient picker"
            onClick={onClose}
          >
            <ProtoCloseIcon />
          </button>
        </div>

        <div className="proto-avail-body proto-avail-body--stack">
          <div className="proto-recipient-picker__row">
            <div className="proto-recipient-picker__toggle-row">
              <div className="proto-avail-toggle" role="tablist" aria-label="Recipient">
                {(Object.keys(RECIPIENT_LABELS) as RecipientMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={draft === mode}
                    className={
                      draft === mode
                        ? "proto-avail-toggle__tab proto-avail-toggle__tab--active"
                        : "proto-avail-toggle__tab"
                    }
                    onClick={() => setDraft(mode)}
                  >
                    {RECIPIENT_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>
            <RecipientDisclaimer mode={draft} />
          </div>
        </div>

        <div className="proto-recipient-picker__footer">
          <button
            type="button"
            className="proto-avail-btn-primary"
            onClick={confirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
