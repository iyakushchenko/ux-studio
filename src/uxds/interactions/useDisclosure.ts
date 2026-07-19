import { useCallback, useState } from "react";
import { nextDisclosureOpen } from "./disclosureState";

export type UseDisclosureOptions = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function useDisclosure(options: UseDisclosureOptions = {}) {
  const controlled = options.open !== undefined;
  const [uncontrolled, setUncontrolled] = useState(
    options.defaultOpen ?? false
  );
  const open = controlled ? (options.open as boolean) : uncontrolled;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setUncontrolled(next);
      options.onOpenChange?.(next);
    },
    [controlled, options]
  );

  const toggle = useCallback(() => {
    setOpen(nextDisclosureOpen(open));
  }, [open, setOpen]);

  return { open, setOpen, toggle };
}
