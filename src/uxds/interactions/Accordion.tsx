import {
  createContext,
  useContext,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useAccordion, type UseAccordionOptions } from "./useAccordion";

type AccordionCtx = {
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
};

const Ctx = createContext<AccordionCtx | null>(null);

function useAccordionCtx(): AccordionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("Accordion.* must be used inside <Accordion>");
  }
  return ctx;
}

export type AccordionProps = UseAccordionOptions & {
  children: ReactNode;
  className?: string;
  "data-name"?: string;
};

/** Multi-item expand/collapse kit — compose Item / Trigger / Content. */
export function Accordion({
  children,
  className,
  "data-name": dataName = "uxds.interaction.accordion",
  ...options
}: AccordionProps) {
  const api = useAccordion(options);
  return (
    <Ctx.Provider value={api}>
      <div className={className} data-name={dataName} data-uxds-kit="accordion">
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function AccordionItem({
  id,
  children,
  className,
  ...rest
}: {
  id: string;
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const { isOpen } = useAccordionCtx();
  return (
    <div
      className={className}
      data-name="uxds.interaction.accordion.item"
      data-uxds-accordion-item={id}
      data-state={isOpen(id) ? "open" : "closed"}
      {...rest}
    >
      {children}
    </div>
  );
}

export function AccordionTrigger({
  id,
  children,
  className,
  ...rest
}: {
  id: string;
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { isOpen, toggle } = useAccordionCtx();
  const open = isOpen(id);
  const { onClick, ...btnRest } = rest;
  return (
    <button
      type="button"
      className={className}
      aria-expanded={open}
      data-name="uxds.interaction.accordion.trigger"
      data-state={open ? "open" : "closed"}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) toggle(id);
      }}
      {...btnRest}
    >
      {children}
    </button>
  );
}

export function AccordionContent({
  id,
  children,
  className,
  ...rest
}: {
  id: string;
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const { isOpen } = useAccordionCtx();
  if (!isOpen(id)) return null;
  return (
    <div
      className={className}
      data-name="uxds.interaction.accordion.content"
      data-state="open"
      {...rest}
    >
      {children}
    </div>
  );
}
