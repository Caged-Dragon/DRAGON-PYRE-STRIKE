import React from "react";
import type { UiTokens } from "../config/uiTokens";

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

interface PanelProps {
  tokens: UiTokens;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  tokens: t,
  title,
  subtitle,
  icon,
  action,
  className = "",
  bodyClassName = "",
  children,
}) => (
  <section
    className={`relative overflow-hidden rounded-3xl transition-colors duration-300 ${t.panel} ${
      t.isDragon ? "dragon-claw-accent" : ""
    } ${className}`}
    style={
      t.isDragon
        ? ({ ["--claw-color" as string]: `${t.xColor}80` } as React.CSSProperties)
        : undefined
    }
  >
    {t.isDragon && (
      <div
        aria-hidden="true"
        className="dragon-panel-scales pointer-events-none absolute inset-0 opacity-60"
      />
    )}
    {(title || action) && (
      <header className="relative flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon && (
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.iconTile}`}
            >
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h3 className={`truncate text-sm font-bold tracking-tight ${t.textStrong}`}>
              {title}
            </h3>
            {subtitle && (
              <p className={`truncate text-[11px] ${t.textMuted}`}>{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
    )}
    <div className={`relative p-4 sm:p-5 ${title ? "pt-3.5 sm:pt-4" : ""} ${bodyClassName}`}>
      {children}
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Field label                                                         */
/* ------------------------------------------------------------------ */

export const FieldLabel: React.FC<{
  tokens: UiTokens;
  children: React.ReactNode;
  hint?: React.ReactNode;
}> = ({ tokens: t, children, hint }) => (
  <div className="mb-1.5 flex items-center justify-between gap-2">
    <span className={t.label}>{children}</span>
    {hint && <span className={`truncate text-[11px] ${t.textMuted}`}>{hint}</span>}
  </div>
);

/* ------------------------------------------------------------------ */
/* Segmented control                                                   */
/* ------------------------------------------------------------------ */

export interface SegOption<T> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
}

interface SegmentedProps<T extends string | number> {
  tokens: UiTokens;
  options: SegOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  size?: "sm" | "md";
  className?: string;
}

export function Segmented<T extends string | number>({
  tokens: t,
  options,
  value,
  onChange,
  ariaLabel,
  size = "md",
  className = "",
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      className={`grid gap-1 rounded-xl p-1 ${t.segTrack} ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-[9px] font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 ${t.ring} ${
              size === "sm" ? "px-1.5 py-1.5 text-[11px]" : "px-2 py-2 text-xs"
            } ${active ? t.segActive : t.segIdle}`}
          >
            {opt.icon}
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle switch                                                       */
/* ------------------------------------------------------------------ */

export const Toggle: React.FC<{
  tokens: UiTokens;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}> = ({ tokens: t, checked, onChange, label, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    style={
      checked
        ? { backgroundColor: t.xColor, boxShadow: `0 6px 16px -8px ${t.xColor}` }
        : undefined
    }
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
      t.ring
    } ${
      t.isDragon ? "focus-visible:ring-offset-black" : "focus-visible:ring-offset-white"
    } disabled:cursor-not-allowed disabled:opacity-40 ${
      checked ? "" : t.isDragon ? "bg-white/15" : "bg-slate-300"
    }`}
  >
    <span
      aria-hidden="true"
      className={`inline-block h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-200 ${
        checked ? "translate-x-[22px]" : "translate-x-0.5"
      }`}
    />
  </button>
);

/* ------------------------------------------------------------------ */
/* Setting rows                                                        */
/* ------------------------------------------------------------------ */

type RowLayout = "inline" | "wide" | "stack";

/**
 * One labelled setting.
 * - inline: small control (toggle/button) pinned to the right
 * - wide:   control sits beside the text when there is room and wraps
 *           underneath at full width when the container gets narrow
 * - stack:  control always below the text
 */
export const SettingRow: React.FC<{
  tokens: UiTokens;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  control: React.ReactNode;
  layout?: RowLayout;
}> = ({ tokens: t, title, description, icon, control, layout = "inline" }) => {
  const text = (
    <div
      className={`flex min-w-0 items-start gap-3 ${
        layout === "wide" ? "flex-[999_1_14rem]" : layout === "inline" ? "flex-1" : ""
      }`}
    >
      {icon && (
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.iconTile}`}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <div className={`text-[13px] font-semibold ${t.textStrong}`}>{title}</div>
        {description && (
          <div className={`mt-0.5 text-[11.5px] leading-snug ${t.textMuted}`}>
            {description}
          </div>
        )}
      </div>
    </div>
  );

  if (layout === "stack") {
    return (
      <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
        {text}
        <div>{control}</div>
      </div>
    );
  }

  if (layout === "wide") {
    return (
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4 first:pt-0 last:pb-0">
        {text}
        <div className="min-w-0 flex-[1_1_16rem]">{control}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      {text}
      <div className="shrink-0">{control}</div>
    </div>
  );
};

export const SettingGroup: React.FC<{
  tokens: UiTokens;
  children: React.ReactNode;
  className?: string;
}> = ({ tokens: t, children, className = "" }) => (
  <div
    className={`divide-y ${
      t.isDragon ? "divide-white/[0.07]" : "divide-slate-200/80"
    } ${className}`}
  >
    {children}
  </div>
);
