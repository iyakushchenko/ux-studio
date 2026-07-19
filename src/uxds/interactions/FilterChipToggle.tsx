import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import {
  useFilterChipToggle,
  type UseFilterChipToggleOptions,
} from "./useFilterChipToggle";

export type FilterChipGroupProps = UseFilterChipToggleOptions & {
  children: (api: {
    selected: string[];
    toggle: (id: string) => void;
    isSelected: (id: string) => boolean;
  }) => ReactNode;
  className?: string;
  "data-name"?: string;
};

/** Facet / quick-filter chip group — multi or single select. */
export function FilterChipGroup({
  children,
  className,
  "data-name": dataName = "uxds.interaction.filter-chip-group",
  ...options
}: FilterChipGroupProps) {
  const api = useFilterChipToggle(options);
  return (
    <div
      className={className}
      data-name={dataName}
      data-uxds-kit="filter-chip"
      role="group"
    >
      {children(api)}
    </div>
  );
}

export function FilterChip({
  id,
  selected,
  onToggle,
  children,
  className,
  ...rest
}: {
  id: string;
  selected: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "id">) {
  const { onClick, ...btnRest } = rest;
  return (
    <button
      type="button"
      className={
        className
          ? `${className}${selected ? " is-selected" : ""}`
          : selected
            ? "uxds-filter-chip is-selected"
            : "uxds-filter-chip"
      }
      aria-pressed={selected}
      data-name="uxds.interaction.filter-chip"
      data-uxds-filter-chip={id}
      data-state={selected ? "on" : "off"}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onToggle(id);
      }}
      {...btnRest}
    >
      {children}
    </button>
  );
}

export function FilterChipRow({
  children,
  className,
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className ?? "uxds-filter-chip-row"}
      data-name="uxds.interaction.filter-chip-row"
      {...rest}
    >
      {children}
    </div>
  );
}
