import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, Level } from "@/data/exercises";
import type { GmfcsLevel } from "@/data/gmfcs";

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
  /** Показывать только упражнения, подходящие уровню GMFCS ребёнка */
  fitOnly: boolean;
  /** Ориентировочный уровень GMFCS: от врача или по опроснику Барсика */
  gmfcs: GmfcsLevel | null;
  gmfcsSource: "doctor" | "quiz" | null;
  done: DoneMap;
  /** Последний разбор по каждому упражнению */
  results: Record<string, SessionResult>;

  setCategory: (category: Filter<Category>) => void;
  setLevel: (level: Filter<Level>) => void;
  setQuery: (query: string) => void;
  setFitOnly: (fitOnly: boolean) => void;
  setGmfcs: (level: GmfcsLevel | null, source: "doctor" | "quiz" | null) => void;
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
      fitOnly: false,
      gmfcs: null,
      gmfcsSource: null,
      done: {},
      results: {},

      setCategory: (category) => set({ category }),
      setLevel: (level) => set({ level }),
      setQuery: (query) => set({ query }),
      setFitOnly: (fitOnly) => set({ fitOnly }),
      setGmfcs: (gmfcs, gmfcsSource) =>
        set({ gmfcs, gmfcsSource, fitOnly: gmfcs !== null }),
      markDone: (id) =>
        set((s) => (id in s.done ? s : { done: { ...s.done, [id]: Date.now() } })),
      saveResult: (result) =>
        set((s) => ({
          results: { ...s.results, [result.exerciseId]: result },
        })),
      resetFilters: () =>
        set({ category: "Все", level: "Все", query: "", fitOnly: false }),
      resetProgress: () => set({ done: {}, results: {} }),
    }),
    {
      name: "dfv-exercises",
      skipHydration: true,
      version: 2,
      // фильтры не сохраняем, они относятся только к текущему сеансу
      partialize: (s) => ({
        done: s.done,
        results: s.results,
        gmfcs: s.gmfcs,
        gmfcsSource: s.gmfcsSource,
      }),
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

/** Подключает localStorage конкретного аккаунта. Старый общий ключ переносится один раз. */
export async function bindExerciseStore(userId: string) {
  const name = `dfv-exercises-${userId}`;
  if (
    useExerciseStore.persist.getOptions().name === name &&
    useExerciseStore.persist.hasHydrated()
  ) {
    return;
  }

  if (typeof window !== "undefined") {
    const legacyKey = "dfv-exercises";
    const legacy = localStorage.getItem(legacyKey);
    const hasScoped = Object.keys(localStorage).some((key) => key.startsWith("dfv-exercises-"));
    if (legacy && !hasScoped) localStorage.setItem(name, legacy);
  }

  useExerciseStore.persist.setOptions({ name });
  // уровень GMFCS прошлого аккаунта не должен достаться новому: у старых
  // сохранений этого поля нет, и rehydrate оставил бы текущее значение
  useExerciseStore.setState({ gmfcs: null, gmfcsSource: null, fitOnly: false });
  if (typeof window !== "undefined" && !localStorage.getItem(name)) {
    useExerciseStore.setState({
      category: "Все",
      level: "Все",
      query: "",
      fitOnly: false,
      gmfcs: null,
      gmfcsSource: null,
      done: {},
      results: {},
    });
  }
  await useExerciseStore.persist.rehydrate();
}
