"use client";

import { Star } from "lucide-react";
import { useExerciseStore } from "@/store/useExerciseStore";
import { useHydrated } from "./useHydrated";

export default function DoneBadge({ id }: { id: string }) {
  const doneMap = useExerciseStore((s) => s.done);
  const hydrated = useHydrated();
  const done = hydrated && id in doneMap;

  if (!done) return null;

  return (
    <span className="flex rotate-3 items-center gap-2 rounded-full bg-sun px-5 py-3 text-sm font-extrabold text-ink shadow-[0_4px_0_var(--sun-deep)]">
      <Star className="size-5" fill="currentColor" strokeWidth={0} aria-hidden />
      Пройдено
    </span>
  );
}
