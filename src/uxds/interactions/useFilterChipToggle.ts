import { useCallback, useState } from "react";
import {
  isFilterChipSelected,
  toggleFilterChip,
  type FilterChipMode,
} from "./filterChipState";

export type UseFilterChipToggleOptions = {
  mode?: FilterChipMode;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (selected: string[]) => void;
};

export function useFilterChipToggle(options: UseFilterChipToggleOptions = {}) {
  const mode = options.mode ?? "multi";
  const controlled = options.value !== undefined;
  const [uncontrolled, setUncontrolled] = useState<string[]>(
    options.defaultValue ?? []
  );
  const selected = controlled ? (options.value as string[]) : uncontrolled;

  const setSelected = useCallback(
    (next: string[]) => {
      if (!controlled) setUncontrolled(next);
      options.onValueChange?.(next);
    },
    [controlled, options]
  );

  const toggle = useCallback(
    (id: string) => {
      setSelected(toggleFilterChip(selected, id, mode));
    },
    [mode, selected, setSelected]
  );

  const isSelected = useCallback(
    (id: string) => isFilterChipSelected(selected, id),
    [selected]
  );

  return { selected, toggle, isSelected, setSelected, mode };
}
