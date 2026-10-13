"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/** Гамбургер для узких экранов: раскрывает разделы под шапкой. */
export default function MobileMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // после перехода на другую страницу меню закрывается само
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // тап мимо меню тоже закрывает его
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        data-tour="nav"
        onClick={() => setOpen((v) => !v)}
        className={`flex size-11 items-center justify-center ${
          open ? "pill-kid-active" : "pill-kid"
        }`}
      >
        {open ? (
          <X className="size-6" strokeWidth={2.5} aria-hidden />
        ) : (
          <Menu className="size-6" strokeWidth={2.5} aria-hidden />
        )}
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full border-b-2 border-line bg-[#FFF8EC] px-4 pb-5 pt-3 shadow-[0_8px_0_rgb(243_227_198/0.6)]"
          // кнопка «Обучение» и ссылки тоже закрывают меню
          onClick={(e) => {
            if ((e.target as Element).closest("a, button")) setOpen(false);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
