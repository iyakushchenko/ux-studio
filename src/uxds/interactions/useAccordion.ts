import { useCallback, useState } from "react";
import {
  isAccordionItemOpen,
  toggleAccordionValue,
  type AccordionType,
} from "./accordionState";

export type UseAccordionOptions = {
  type?: AccordionType;
  /** Controlled open ids */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (open: string[]) => void;
};

export function useAccordion(options: UseAccordionOptions = {}) {
  const type = options.type ?? "single";
  const controlled = options.value !== undefined;
  const [uncontrolled, setUncontrolled] = useState<string[]>(
    options.defaultValue ?? []
  );
  const open = controlled ? (options.value as string[]) : uncontrolled;

  const setOpen = useCallback(
    (next: string[]) => {
      if (!controlled) setUncontrolled(next);
      options.onValueChange?.(next);
    },
    [controlled, options]
  );

  const toggle = useCallback(
    (id: string) => {
      setOpen(toggleAccordionValue(open, id, type));
    },
    [open, setOpen, type]
  );

  const isOpen = useCallback(
    (id: string) => isAccordionItemOpen(open, id),
    [open]
  );

  return { open, setOpen, toggle, isOpen, type };
}
