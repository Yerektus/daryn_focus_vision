"use client";

import { Check } from "lucide-react";
import { useExerciseStore } from "@/store/useExerciseStore";
import { useHydrated } from "./useHydrated";

export default function DoneBadge({ id }: { id: string }) {
  const doneMap = useExerciseStore((s) => s.done);
  const hydrated = useHydrated();
  const done = hydrated && id in doneMap;

  if (!done) return null;

  return (
    <span className="flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-extrabold text-white">
      <Check className="size-4" strokeWidth={3.5} aria-hidden />
      Пройдено
    </span>
  );
}
