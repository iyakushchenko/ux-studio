import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { useDisclosure, type UseDisclosureOptions } from "./useDisclosure";

export type DisclosureProps = UseDisclosureOptions & {
  children: (api: {
    open: boolean;
    toggle: () => void;
    setOpen: (open: boolean) => void;
  }) => ReactNode;
  className?: string;
  "data-name"?: string;
};

/** Controlled/uncontrolled show/hide kit (dropdown body, hours panel, etc.). */
export function Disclosure({
  children,
  className,
  "data-name": dataName = "uxds.interaction.disclosure",
  ...options
}: DisclosureProps) {
  const api = useDisclosure(options);
  return (
    <div
      className={className}
      data-name={dataName}
      data-uxds-kit="disclosure"
      data-state={api.open ? "open" : "closed"}
    >
      {children(api)}
    </div>
  );
}

export function DisclosureTrigger({
  open,
  onToggle,
  children,
  className,
  ...rest
}: {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onClick, ...btnRest } = rest;
  return (
    <button
      type="button"
      className={className}
      aria-expanded={open}
      data-name="uxds.interaction.disclosure.trigger"
      data-state={open ? "open" : "closed"}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onToggle();
      }}
      {...btnRest}
    >
      {children}
    </button>
  );
}

export function DisclosureContent({
  open,
  children,
  className,
  ...rest
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  if (!open) return null;
  return (
    <div
      className={className}
      data-name="uxds.interaction.disclosure.content"
      data-state="open"
      {...rest}
    >
      {children}
    </div>
  );
}
