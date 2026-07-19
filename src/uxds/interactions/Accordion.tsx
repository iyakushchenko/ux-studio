import {
  createContext,
  useContext,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type SVGAttributes,
} from "react";
import { useAccordion, type UseAccordionOptions } from "./useAccordion";
import "./accordion.css";

type AccordionCtx = {
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
};

type AccordionItemCtx = {
  id: string;
  open: boolean;
};

const Ctx = createContext<AccordionCtx | null>(null);
const ItemCtx = createContext<AccordionItemCtx | null>(null);

function useAccordionCtx(): AccordionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("Accordion.* must be used inside <Accordion>");
  }
  return ctx;
}

function useAccordionItemCtx(): AccordionItemCtx {
  const ctx = useContext(ItemCtx);
  if (!ctx) {
    throw new Error("Accordion chevron/content helpers need <AccordionItem>");
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
  const open = isOpen(id);
  return (
    <ItemCtx.Provider value={{ id, open }}>
      <div
        className={className}
        data-name="uxds.interaction.accordion.item"
        data-uxds-accordion-item={id}
        data-state={open ? "open" : "closed"}
        {...rest}
      >
        {children}
      </div>
    </ItemCtx.Provider>
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

/** Default down-chevron — muted when closed, brand-strong + rotated when open. */
export function AccordionChevron({
  className,
  ...rest
}: {
  className?: string;
} & SVGAttributes<SVGSVGElement>) {
  useAccordionItemCtx();
  return (
    <span
      className={className}
      data-name="uxds.interaction.accordion.chevron"
      aria-hidden
    >
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none" {...rest}>
        <path
          d="M16 1.43879L8 10L0 1.43879L1.34448 0L8 7.12242L14.6555 0L16 1.43879Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

/**
 * Always-mounted panel — CSS grid-template-rows 0fr↔1fr (no height:auto measure).
 * `data-studio-accordion-open` is stamped only while open (probe contract).
 * Page `className` / `data-name` land on the inner panel (padding-safe).
 */
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
  const open = isOpen(id);
  const {
    "data-studio-accordion-open": _studioOpenIgnored,
    ...panelRest
  } = rest as HTMLAttributes<HTMLDivElement> & {
    "data-studio-accordion-open"?: string;
  };

  return (
    <div
      className="uxds-accordion-content"
      data-name="uxds.interaction.accordion.content"
      data-state={open ? "open" : "closed"}
      data-studio-accordion-open={open ? id : undefined}
      aria-hidden={!open}
    >
      <div
        className="uxds-accordion-content__clip"
        data-name="uxds.interaction.accordion.content.clip"
      >
        <div
          className={
            className
              ? `uxds-accordion-content__panel ${className}`
              : "uxds-accordion-content__panel"
          }
          {...panelRest}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
