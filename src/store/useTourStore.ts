import { create } from "zustand";

/** Обучение с Барсиком. Живёт в памяти: тур идёт через переходы между
 *  страницами, а после перезагрузки начинается заново по кнопке. */
type TourState = {
  active: boolean;
  step: number;
  /** Упражнение, на примере которого Барсик показывает страницу упражнения */
  exerciseId: string;
  start: (exerciseId: string) => void;
  go: (step: number) => void;
  stop: () => void;
};

export const useTourStore = create<TourState>()((set) => ({
  active: false,
  step: 0,
  exerciseId: "bridge",
  start: (exerciseId) => set({ active: true, step: 0, exerciseId }),
  go: (step) => set({ step }),
  stop: () => set({ active: false, step: 0 }),
}));
