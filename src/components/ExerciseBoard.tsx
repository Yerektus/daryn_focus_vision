"use client";

import { useMemo } from "react";
import { exercises } from "@/data/exercises";
import { fitsLevel } from "@/data/gmfcs";
import { useExerciseStore } from "@/store/useExerciseStore";
import ExerciseCard from "./ExerciseCard";
import Filters from "./Filters";
import Mascot from "./Mascot";

export default function ExerciseBoard() {
  const category = useExerciseStore((s) => s.category);
  const level = useExerciseStore((s) => s.level);
  const query = useExerciseStore((s) => s.query);
  const fitOnly = useExerciseStore((s) => s.fitOnly);
  const gmfcs = useExerciseStore((s) => s.gmfcs);
  const resetFilters = useExerciseStore((s) => s.resetFilters);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (category !== "Все" && e.category !== category) return false;
      if (level !== "Все" && e.level !== level) return false;
      if (fitOnly && !fitsLevel(e.id, gmfcs)) return false;
      if (q && !`${e.title} ${e.goal} ${e.category}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [category, level, query, fitOnly, gmfcs]);

  return (
    <>
      <Filters />

      <p className="mt-8 text-sm font-extrabold text-ink/50">
        Упражнений в подборке: {filtered.length}
      </p>

      {filtered.length === 0 ? (
        <div className="card-kid mt-4 flex flex-col items-center p-10 text-center">
          <Mascot className="mb-4 h-28 w-22" />
          <p className="heading-kid text-xl">
            Ничего не нашлось
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="btn-kid mt-5 px-6 py-3 text-sm font-extrabold"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <ul data-tour="cards" className="mt-4 grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((e) => (
            <ExerciseCard key={e.id} exercise={e} />
          ))}
        </ul>
      )}
    </>
  );
}
