"use client";

import { Check, Search } from "lucide-react";
import { categories, type Category, type Level } from "@/data/exercises";
import { gmfcsRoman } from "@/data/gmfcs";
import { useExerciseStore } from "@/store/useExerciseStore";
import Select from "./Select";

const levels: Level[] = ["Начальный", "Средний", "Продвинутый"];

const categoryOptions = [
  { value: "Все", label: "Все виды" },
  ...categories.map((c) => ({ value: c, label: c })),
];

const levelOptions = [
  { value: "Все", label: "Любой уровень" },
  ...levels.map((l) => ({ value: l, label: l })),
];

export default function Filters() {
  const {
    category,
    level,
    query,
    fitOnly,
    gmfcs,
    setCategory,
    setLevel,
    setQuery,
    setFitOnly,
  } = useExerciseStore();

  return (
    <div className="flex flex-col gap-3" data-tour="filters">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-5 top-1/2 size-[18px] -translate-y-1/2 text-grape"
          strokeWidth={2.5}
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти упражнение"
          aria-label="Поиск упражнений"
          className="w-full rounded-full border-2 border-line bg-white py-4 pl-13 pr-5 text-sm font-semibold text-ink outline-none transition placeholder:font-medium placeholder:text-ink/40 focus:border-grape"
        />
      </div>

      <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
        <Select
          value={category}
          options={categoryOptions}
          onChange={(v) => setCategory(v as Category | "Все")}
          label="Вид упражнений"
        />
        <Select
          value={level}
          options={levelOptions}
          onChange={(v) => setLevel(v as Level | "Все")}
          label="Уровень сложности"
        />
      </div>

      {gmfcs !== null && (
        <button
          type="button"
          aria-pressed={fitOnly}
          onClick={() => setFitOnly(!fitOnly)}
          className={`flex w-fit items-center gap-2 px-5 py-3 text-sm font-extrabold ${
            fitOnly ? "pill-kid-active" : "pill-kid"
          }`}
        >
          {fitOnly && <Check className="size-4" strokeWidth={3} aria-hidden />}
          Подходят ребёнку · GMFCS {gmfcsRoman[gmfcs]}
        </button>
      )}
    </div>
  );
}
