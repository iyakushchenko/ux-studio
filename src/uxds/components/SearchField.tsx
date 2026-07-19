import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { CloseIcon } from "@/app/chrome/CloseIcon";
import iconSearch from "@/assets/avail/search.svg";

export type SearchFieldIconPosition = "start" | "end";

export type SearchFieldProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** Visible label above the field (optional). */
  label?: string;
  /** Hint / helper under the field (optional). */
  hint?: string;
  /**
   * Magnifier position — Make/Availability/Book Step 1 = `end` (right).
   * Stamp `data-studio-search-icon-pos`.
   */
  iconPosition?: SearchFieldIconPosition;
  /** Show clear (X) when value is non-empty. Default true. */
  clearable?: boolean;
  onClear?: () => void;
  className?: string;
  inputClassName?: string;
  "data-name"?: string;
  "aria-label"?: string;
  /** Custom search icon (defaults to mint magnifier asset). */
  searchIcon?: ReactNode;
} & Pick<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "name" | "disabled" | "autoComplete" | "onFocus" | "onBlur" | "onKeyDown"
>;

/**
 * UXDS search / text field — pill chrome, icon start|end, single clear control.
 * Uses `type="text"` (not `search`) so browsers never paint a second native X.
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  hint,
  iconPosition = "end",
  clearable = true,
  onClear,
  className,
  inputClassName,
  "data-name": dataName = "component.input.field",
  "aria-label": ariaLabel,
  searchIcon,
  id,
  disabled,
  ...rest
}: SearchFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const filled = value.trim().length > 0;
  const showClear = clearable && filled && !disabled;

  const clear = () => {
    onChange("");
    onClear?.();
  };

  const icon = (
    <span
      className="uxds-search-field__icon"
      data-name="icon=search"
      data-studio-search-icon="true"
      data-studio-search-icon-pos={iconPosition}
      aria-hidden
    >
      {searchIcon ?? (
        <img src={iconSearch} alt="" width={24} height={24} draggable={false} />
      )}
    </span>
  );

  const clearBtn = showClear ? (
    <button
      type="button"
      className="uxds-search-field__clear"
      data-name="icon=clear"
      data-studio-search-clear="true"
      aria-label="Clear search"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        clear();
      }}
    >
      <CloseIcon size={16} />
    </button>
  ) : null;

  return (
    <div
      className={`uxds-search-field${className ? ` ${className}` : ""}`}
      data-name={dataName}
      data-studio-react-owned="true"
      data-studio-search-filled={filled ? "true" : "false"}
      data-studio-search-icon-pos={iconPosition}
      data-disabled={disabled ? "true" : undefined}
    >
      {label ? (
        <label className="uxds-search-field__label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <div className="uxds-search-field__control" data-name="Text Field">
        {iconPosition === "start" ? icon : null}
        <input
          id={inputId}
          className={`uxds-search-field__input proto-search-input${
            inputClassName ? ` ${inputClassName}` : ""
          }`}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel ?? placeholder ?? label ?? "Search"}
          aria-describedby={hintId}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        />
        {clearBtn}
        {iconPosition === "end" ? icon : null}
      </div>
      {hint ? (
        <p className="uxds-search-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
