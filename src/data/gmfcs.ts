import { exercises, type Exercise, type Level } from "./exercises";

/** GMFCS (Gross Motor Function Classification System) это принятая
 *  классификация двигательных возможностей при ДЦП, уровни I–V.
 *  Уровень ставит врач. Здесь опросник родителя даёт только ориентир
 *  для подбора упражнений, это не диагноз. */
export type GmfcsLevel = 1 | 2 | 3 | 4 | 5;

export const GMFCS_LEVELS: GmfcsLevel[] = [1, 2, 3, 4, 5];

export const gmfcsRoman: Record<GmfcsLevel, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
};

/** Описания упрощены для родителя по мотивам GMFCS E&R (6–12 лет). */
export const gmfcsInfo: Record<GmfcsLevel, { short: string; text: string }> = {
  1: {
    short: "Ходит без ограничений",
    text: "Ходит дома и на улице, поднимается по лестнице без перил, бегает и прыгает, но скорость и координация могут быть ниже, чем у сверстников.",
  },
  2: {
    short: "Ходит с ограничениями",
    text: "Ходит сам, но на лестнице держится за перила, на неровной поверхности и на длинных расстояниях бывает трудно. Бегать и прыгать почти не получается.",
  },
  3: {
    short: "Ходит с опорой",
    text: "Ходит с ходунками или костылями, сидит сам, иногда нужна опора рукой. На дальние расстояния чаще передвигается в коляске.",
  },
  4: {
    short: "Передвигается с помощью",
    text: "Сидит с поддержкой корпуса, сам передвигается мало, чаще в коляске или с помощью взрослого. Может стоять с опорой при пересаживании.",
  },
  5: {
    short: "Нужна полная поддержка",
    text: "Нужна поддержка головы и корпуса в любом положении, передвигается в коляске с помощью взрослого.",
  },
};

export type QuizQuestion = {
  id: string;
  text: string;
  answers: { label: string; next: string | GmfcsLevel }[];
};

/** Короткое дерево вопросов: каждый ответ ведёт к следующему вопросу или к уровню. */
export const gmfcsQuiz: Record<string, QuizQuestion> = {
  walk: {
    id: "walk",
    text: "Ребёнок ходит по дому сам, без ходунков, костылей и без руки взрослого?",
    answers: [
      { label: "Да, ходит сам", next: "stairs" },
      { label: "Ходит, но с ходунками или костылями", next: 3 },
      { label: "Нет, сам не ходит", next: "sit" },
    ],
  },
  stairs: {
    id: "stairs",
    text: "Может ли ребёнок подняться по лестнице, не держась за перила, и пробежать или подпрыгнуть?",
    answers: [
      { label: "Да, хоть и медленнее сверстников", next: 1 },
      { label: "Нет, держится за перила, бегать трудно", next: 2 },
    ],
  },
  sit: {
    id: "sit",
    text: "Как ребёнок сидит и держит голову?",
    answers: [
      { label: "Сидит, если подстраховать корпус, голову держит", next: 4 },
      { label: "Нужна поддержка и головы, и корпуса", next: 5 },
    ],
  },
};

export const QUIZ_START = "walk";

/** До какого уровня GMFCS упражнение обычно выполнимо дома.
 *  Нет в списке значит подходит всем: кисть, дыхание, речь. */
const maxLevel: Record<string, GmfcsLevel> = {
  bridge: 4,
  "sit-to-stand": 3,
  "crawl-tunnel": 4,
  "calf-stretch": 3,
  "trunk-rotation": 4,
  "balance-board": 3,
  "line-walk": 2,
};

export function fitsLevel(exerciseId: string, level: GmfcsLevel | null) {
  if (level === null) return true;
  return level <= (maxLevel[exerciseId] ?? 5);
}

export const GMFCS_DISCLAIMER =
  "Это ориентир для подбора упражнений, а не диагноз. Точный уровень GMFCS определяет врач.";

const levelRank: Record<Level, number> = {
  Начальный: 0,
  Средний: 1,
  Продвинутый: 2,
};

/** План на сегодня: подходящие уровню и ещё не пройденные, от простых,
 *  по возможности из разных направлений. */
export function pickPlan(
  level: GmfcsLevel | null,
  done: Record<string, number>,
  size = 3,
): Exercise[] {
  // sort стабилен: внутри уровня сложности сохраняется порядок каталога
  const pool = exercises
    .filter((e) => fitsLevel(e.id, level) && !(e.id in done))
    .sort((a, b) => levelRank[a.level] - levelRank[b.level]);
  const picked: Exercise[] = [];
  for (const e of pool) {
    if (picked.length === size) break;
    if (!picked.some((p) => p.category === e.category)) picked.push(e);
  }
  for (const e of pool) {
    if (picked.length === size) break;
    if (!picked.includes(e)) picked.push(e);
  }
  return picked;
}
