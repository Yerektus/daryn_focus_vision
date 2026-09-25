"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type Option = { value: string; label: string };

type Props = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  /** Подпись для скринридера */
  label: string;
};

export default function Select({ value, options, onChange, label }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-full bg-white py-4 pl-5 pr-4 text-left text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
      >
        <span className="truncate">{current.label}</span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-neutral-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={3}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-[26px] bg-white p-2 shadow-[0_18px_44px_rgba(0,0,0,0.16)]"
        >
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={selected}
                tabIndex={0}
                onClick={() => pick(o.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    pick(o.value);
                  }
                }}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-full px-4 py-2.5 text-sm outline-none transition ${
                  selected
                    ? "bg-neutral-900 font-bold text-white"
                    : "font-semibold text-neutral-600 hover:bg-neutral-100 focus:bg-neutral-100"
                }`}
              >
                {o.label}
                {selected && (
                  <Check className="size-3.5" strokeWidth={3.5} aria-hidden />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
