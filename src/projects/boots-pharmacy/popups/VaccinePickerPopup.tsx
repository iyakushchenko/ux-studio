import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { CloseIcon } from "@/app/chrome/CloseIcon";
import { useOverlayDismiss } from "@/app/chrome/useOverlayDismiss";
import {
  readVaccinesFromPlp,
  type VaccineItem,
} from "@/projects/boots-pharmacy/data/vaccineList";
import iconCheckChosen from "@/assets/avail/check-chosen.svg";

type Props = {
  open: boolean;
  selectedId: string;
  onClose: () => void;
  onSelect: (vaccine: VaccineItem) => void;
};

function VaccineTile({
  vaccine,
  chosen,
  onSelect,
}: {
  vaccine: VaccineItem;
  chosen: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`proto-vaccine-tile${chosen ? " proto-vaccine-tile--chosen" : ""}`}
      data-studio-vaccine-id={vaccine.id}
    >
      <div className="proto-vaccine-tile__main">
        <div className="proto-vaccine-tile__head">
          <p className="proto-vaccine-tile__title">{vaccine.title}</p>
          {vaccine.subtitle ? (
            <p className="proto-vaccine-tile__subtitle">{vaccine.subtitle}</p>
          ) : null}
        </div>
        {vaccine.description ? (
          <p className="proto-vaccine-tile__desc">{vaccine.description}</p>
        ) : null}
      </div>
      <div className="proto-vaccine-tile__aside">
        {vaccine.price ? (
          <div className="proto-vaccine-tile__price">
            <span className="proto-vaccine-tile__price-label">
              Price for 1 dose
            </span>
            <span className="proto-vaccine-tile__price-value">{vaccine.price}</span>
            {vaccine.booster ? (
              <span className="proto-vaccine-tile__booster">{vaccine.booster}</span>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          className={
            chosen
              ? "proto-avail-btn-secondary proto-avail-btn-secondary--sm proto-avail-btn-secondary--chosen"
              : "proto-avail-btn-secondary proto-avail-btn-secondary--sm"
          }
          data-studio-action={`vaccine-select-${vaccine.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <img
            className={
              chosen
                ? "proto-avail-check-icon"
                : "proto-avail-check-icon proto-secondary-cta-icon"
            }
            src={iconCheckChosen}
            alt=""
            width={16}
            height={16}
          />
          {chosen ? "Selected" : "Select"}
        </button>
      </div>
    </div>
  );
}

export default function VaccinePickerPopup({
  open,
  selectedId,
  onClose,
  onSelect,
}: Props) {
  const { mounted, scrimClassName, onScrimAnimationEnd } = useOverlayDismiss(open);
  const [vaccines, setVaccines] = useState<VaccineItem[]>([]);

  useEffect(() => {
    if (!open) return;
    setVaccines(readVaccinesFromPlp());
  }, [open]);

  const list = useMemo(
    () => (vaccines.length ? vaccines : readVaccinesFromPlp()),
    [vaccines]
  );

  const onScrim = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!mounted) return null;

  return (
    <div
      className={scrimClassName}
      role="presentation"
      data-studio-modal="vaccine-picker"
      onClick={onScrim}
      onAnimationEnd={onScrimAnimationEnd}
    >
      <div
        className="proto-avail-card proto-vaccine-picker-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="proto-vaccine-picker-title"
      >
        <div className="proto-avail-header">
          <h2 id="proto-vaccine-picker-title" className="proto-avail-title">
            Choose Vaccine
          </h2>
          <button
            type="button"
            className="proto-popup-close"
            aria-label="Close vaccine picker"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="proto-avail-body proto-avail-body--stack">
          <div className="proto-vaccine-picker-list">
            {list.map((v) => (
              <VaccineTile
                key={v.id}
                vaccine={v}
                chosen={v.id === selectedId}
                onSelect={() => {
                  onSelect(v);
                  onClose();
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
