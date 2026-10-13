"use client";

import { GraduationCap } from "lucide-react";
import { pickPlan } from "@/data/gmfcs";
import { useExerciseStore } from "@/store/useExerciseStore";
import { useTourStore } from "@/store/useTourStore";

/** Кнопка «Обучение»: зовёт Барсика, и он ведёт по сайту. */
export default function TourButton() {
  const active = useTourStore((s) => s.active);
  const start = useTourStore((s) => s.start);

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => {
        // упражнение-пример берём из плана, чтобы оно подходило ребёнку
        const { gmfcs, done } = useExerciseStore.getState();
        start(pickPlan(gmfcs, done)[0]?.id ?? "bridge");
      }}
      className={`flex items-center gap-2 px-5 py-2.5 text-sm font-extrabold ${
        active ? "pill-kid-active" : "pill-kid"
      }`}
    >
      <GraduationCap className="size-4" strokeWidth={2.5} aria-hidden />
      Обучение
    </button>
  );
}
