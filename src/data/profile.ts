import {
  Crosshair,
  Flame,
  Footprints,
  Medal,
  Mountain,
  PersonStanding,
  Rocket,
  Sparkles,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { DoneMap, SessionResult } from "@/store/useExerciseStore";
import { categories, exercises } from "./exercises";
import type { GmfcsLevel } from "./gmfcs";

/** Образы Барсика: открываются по числу пройденных упражнений,
 *  открытый можно поставить себе на аватар. */
export type Pose = {
  id: string;
  src: string;
  width: number;
  height: number;
  title: string;
  /** Сколько упражнений нужно пройти, чтобы образ открылся */
  need: number;
  /** Что Барсик говорит, когда этот образ последний открытый */
  say: string;
};

export const POSES: Pose[] = [
  {
    id: "wave",
    src: "/mascot/barsik.webp",
    width: 496,
    height: 640,
    title: "Привет!",
    need: 0,
    say: "Давай знакомиться! Пройди первое упражнение, и я покажу новый образ.",
  },
  {
    id: "think",
    src: "/mascot/barsik-think.webp",
    width: 664,
    height: 1047,
    title: "Любопытный",
    need: 1,
    say: "Первое упражнение позади! Интересно, что дальше?",
  },
  {
    id: "stretch",
    src: "/mascot/barsik-stretch.webp",
    width: 682,
    height: 1023,
    title: "Разминка",
    need: 3,
    say: "Мы с тобой уже разогрелись. Тянемся выше!",
  },
  {
    id: "sleep",
    src: "/mascot/barsik-sleep.webp",
    width: 855,
    height: 659,
    title: "Заслуженный отдых",
    need: 5,
    say: "Хорошо потрудились! Отдых тоже важная часть занятий.",
  },
  {
    id: "point",
    src: "/mascot/barsik-point.webp",
    width: 790,
    height: 944,
    title: "Проводник",
    need: 8,
    say: "Ты уже знаешь дорогу сам. Веди, я за тобой!",
  },
  {
    id: "party",
    src: "/mascot/barsik-party.webp",
    width: 718,
    height: 907,
    title: "Чемпион",
    need: exercises.length,
    say: "Все упражнения пройдены! Ты настоящий чемпион!",
  },
];

export function poseById(id: string) {
  return POSES.find((p) => p.id === id) ?? POSES[0]!;
}

type Progress = {
  done: DoneMap;
  results: Record<string, SessionResult>;
  gmfcs: GmfcsLevel | null;
};

export type Sticker = {
  id: string;
  title: string;
  /** Как получить, показывается и на закрытой наклейке */
  hint: string;
  icon: LucideIcon;
  color: string;
  earned: (p: Progress) => boolean;
};

const DAY = 24 * 60 * 60 * 1000;

function dayIndex(t: number) {
  const d = new Date(t);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
}

/** Самая длинная серия дней подряд, когда было хотя бы одно занятие */
export function longestStreak(p: Pick<Progress, "done" | "results">) {
  const days = new Set(
    [...Object.values(p.done), ...Object.values(p.results).map((r) => r.at)].map(dayIndex),
  );
  let best = 0;
  for (const d of days) {
    if (days.has(d - 1)) continue;
    let len = 1;
    while (days.has(d + len)) len++;
    best = Math.max(best, len);
  }
  return best;
}

const count = (p: Progress) => Object.keys(p.done).length;

/** Цвета взяты из палитры категорий, чтобы наклейки не спорили с карточками */
export const STICKERS: Sticker[] = [
  {
    id: "first",
    title: "Первый шаг",
    hint: "Пройти любое упражнение",
    icon: Footprints,
    color: "#2585AE",
    earned: (p) => count(p) >= 1,
  },
  {
    id: "three",
    title: "Тройка",
    hint: "Пройти 3 упражнения",
    icon: Star,
    color: "#A87406",
    earned: (p) => count(p) >= 3,
  },
  {
    id: "streak",
    title: "Три дня подряд",
    hint: "Заниматься 3 дня подряд",
    icon: Flame,
    color: "#CF3A80",
    earned: (p) => longestStreak(p) >= 3,
  },
  {
    id: "explorer",
    title: "Исследователь",
    hint: "Попробовать все 5 направлений",
    icon: Sparkles,
    color: "#7B3FD1",
    earned: (p) => {
      const tried = new Set(
        exercises.filter((e) => e.id in p.done).map((e) => e.category),
      );
      return categories.every((c) => tried.has(c));
    },
  },
  {
    id: "frame",
    title: "Звезда кадра",
    hint: "Почти всё занятие быть в кадре",
    icon: Crosshair,
    color: "#2585AE",
    earned: (p) => Object.values(p.results).some((r) => r.inFramePct >= 90),
  },
  {
    id: "posture",
    title: "Ровная спинка",
    hint: "Заниматься с ровными плечами и тазом",
    icon: PersonStanding,
    color: "#1E9C6B",
    earned: (p) =>
      Object.values(p.results).some(
        (r) => r.inFramePct >= 50 && r.shoulderTiltPct <= 10 && r.hipTiltPct <= 10,
      ),
  },
  {
    id: "half",
    title: "Полпути",
    hint: "Пройти половину упражнений",
    icon: Mountain,
    color: "#A87406",
    earned: (p) => count(p) >= Math.ceil(exercises.length / 2),
  },
  {
    id: "level",
    title: "Свой маршрут",
    hint: "Указать уровень GMFCS",
    icon: Rocket,
    color: "#CF3A80",
    earned: (p) => p.gmfcs !== null,
  },
  {
    id: "week",
    title: "Целая неделя",
    hint: "Заниматься 7 дней подряд",
    icon: Medal,
    color: "#7B3FD1",
    earned: (p) => longestStreak(p) >= 7,
  },
  {
    id: "all",
    title: "Чемпион",
    hint: "Пройти все упражнения",
    icon: Trophy,
    color: "#1E9C6B",
    earned: (p) => count(p) >= exercises.length,
  },
];
