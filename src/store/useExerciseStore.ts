import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, Level } from "@/data/exercises";

type Filter<T> = T | "Все";

/** id упражнения -> время отметки (мс). Даты нужны аналитике. */
export type DoneMap = Record<string, number>;

/** Итог одного занятия перед камерой: цифры для страницы разбора. */
export type SessionResult = {
  exerciseId: string;
  at: number;
  /** Длительность занятия, секунды */
  seconds: number;
  mode: "reps" | "hold" | "guide" | "hand";
  reps: number;
  rounds: number;
  guideSeconds: number;
  /** Доля времени, когда ребёнок целиком попадал в кадр, 0..100 */
  inFramePct: number;
  /** Доля кадров с перекосом плеч и таза, 0..100 */
  shoulderTiltPct: number;
  hipTiltPct: number;
  /** Повторения без полной амплитуды */
  shallowReps: number;
  /** Доля кадров, где позу не удавалось удержать, 0..100 */
  unstablePct: number;
};

type ExerciseState = {
  category: Filter<Category>;
  level: Filter<Level>;
  query: string;
  done: DoneMap;
  /** Последний разбор по каждому упражнению */
  results: Record<string, SessionResult>;

  setCategory: (category: Filter<Category>) => void;
  setLevel: (level: Filter<Level>) => void;
  setQuery: (query: string) => void;
  /** Отметка ставится автоматически после прохождения упражнения на камере */
  markDone: (id: string) => void;
  saveResult: (result: SessionResult) => void;
  resetFilters: () => void;
  resetProgress: () => void;
};

export const useExerciseStore = create<ExerciseState>()(
  persist(
    (set) => ({
      category: "Все",
      level: "Все",
      query: "",
      done: {},
      results: {},

      setCategory: (category) => set({ category }),
      setLevel: (level) => set({ level }),
      setQuery: (query) => set({ query }),
      markDone: (id) =>
        set((s) => (id in s.done ? s : { done: { ...s.done, [id]: Date.now() } })),
      saveResult: (result) =>
        set((s) => ({
          results: { ...s.results, [result.exerciseId]: result },
        })),
      resetFilters: () => set({ category: "Все", level: "Все", query: "" }),
      resetProgress: () => set({ done: {}, results: {} }),
    }),
    {
      name: "dfv-exercises",
      version: 2,
      // фильтры не сохраняем, они относятся только к текущему сеансу
      partialize: (s) => ({ done: s.done, results: s.results }),
      migrate: (persisted, version) => {
        const state = persisted as { done?: unknown };
        // v1 хранил done как массив id, без дат
        if (version < 2 && Array.isArray(state?.done)) {
          const now = Date.now();
          const done: DoneMap = {};
          for (const id of state.done as string[]) done[id] = now;
          return { done, results: {} };
        }
        return {
          done: (state.done ?? {}) as DoneMap,
          results: (state as { results?: Record<string, SessionResult> })
            .results ?? {},
        };
      },
    },
  ),
);
