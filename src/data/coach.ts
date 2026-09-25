import type { Category } from "./exercises";

/** Что именно отслеживает компьютерное зрение в конкретном упражнении.
 *  reps  считает повторения по углу в суставе или по повороту корпуса;
 *  hold  засекает удержание позы, пока ребёнок стабильно стоит или лежит в кадре;
 *  hand  считает работу кистей по 21 точке руки: сжимания, пинцетный захват
 *        или время активной работы пальцев;
 *  guide для движений, которые камерой не измерить: следим только за тем, что
 *        ребёнок в кадре, и засекаем время занятия. */
export type CoachPlan =
  | {
      mode: "reps";
      /** Сустав или ротация корпуса, по которым считаем повторение */
      joint: "knee" | "hip" | "elbow" | "torso";
      /** Угол «нижней» фазы, градусы */
      downAngle: number;
      /** Угол «верхней» фазы, градусы */
      upAngle: number;
      target: number;
      cue: string;
    }
  | { mode: "hold"; seconds: number; rounds: number; cue: string }
  | {
      mode: "hand";
      /** squeeze - сжать и разжать кисть, pinch - щепоть, activity - работа пальцами */
      metric: "squeeze" | "pinch" | "activity";
      /** цель в повторениях (squeeze, pinch) или в секундах (activity) */
      target: number;
      cue: string;
    }
  | { mode: "guide"; seconds: number; cue: string };

/** Цели сверены с шагами упражнения в exercises.ts. */
export const coachPlans: Record<string, CoachPlan> = {
  // «Повторить 6–8 раз»
  bridge: {
    mode: "reps",
    joint: "hip",
    downAngle: 140,
    upAngle: 165,
    target: 8,
    cue: "Поднимай таз до линии «колени, бёдра, плечи»",
  },
  // «8–10 повторений»
  "sit-to-stand": {
    mode: "reps",
    joint: "knee",
    downAngle: 110,
    upAngle: 158,
    target: 10,
    cue: "Наклон вперёд, затем выпрямись полностью",
  },
  // «3–5 проходов»: ползание позой не измеришь, следим за присутствием в кадре
  "crawl-tunnel": {
    mode: "guide",
    seconds: 90,
    cue: "Работают противоположные рука и нога",
  },
  // «10 повторений каждой рукой»
  "ball-squeeze": {
    mode: "hand",
    metric: "squeeze",
    target: 20,
    cue: "Сжимай мяч на счёт три и полностью расслабляй кисть",
  },
  // «10–15 прищепок за занятие»
  clothespins: {
    mode: "hand",
    metric: "pinch",
    target: 12,
    cue: "Открывай прищепку большим и указательным пальцами",
  },
  // Четыре задания с тестом подряд
  dough: {
    mode: "hand",
    metric: "activity",
    target: 120,
    cue: "Разминай тесто двумя руками, пальцы работают активно",
  },
  // «Удерживать 20–30 секунд, по 3 раза на каждую ногу»
  hamstring: {
    mode: "hold",
    seconds: 25,
    rounds: 3,
    cue: "Нога прямая, тянем до натяжения, без боли",
  },
  // «Удерживать 20–30 секунд, по 3 подхода»
  "calf-stretch": {
    mode: "hold",
    seconds: 25,
    rounds: 3,
    cue: "Пятка задней ноги прижата к полу",
  },
  // «По 8 поворотов в каждую сторону»: считаем ротацию плеч относительно таза
  "trunk-rotation": {
    mode: "reps",
    joint: "torso",
    downAngle: 10,
    upAngle: 25,
    target: 16,
    cue: "Таз неподвижен, поворачивается только корпус",
  },
  // «Удержать 3–5 секунд, 8–10 раз на каждую сторону»
  "balance-board": {
    mode: "hold",
    seconds: 5,
    rounds: 10,
    cue: "Перенеси вес на одну ногу и удержи",
  },
  // «4–6 проходов»: это ходьба, а не удержание позы
  "line-walk": {
    mode: "guide",
    seconds: 60,
    cue: "Руки в стороны, смотри вперёд",
  },
  // «5–7 повторений с паузами»
  bubbles: { mode: "guide", seconds: 60, cue: "Плечи опущены, спина прямая" },
  // «8–10 циклов в спокойном темпе»
  diaphragm: {
    mode: "hold",
    seconds: 20,
    rounds: 4,
    cue: "Вдох через нос, выдох вдвое длиннее",
  },
  // Четыре упражнения по 8–10 повторов
  "face-gym": {
    mode: "guide",
    seconds: 90,
    cue: "Голова прямо, работают только мышцы лица",
  },
};

const fallbackByCategory: Record<Category, CoachPlan> = {
  "Крупная моторика": {
    mode: "reps",
    joint: "knee",
    downAngle: 110,
    upAngle: 158,
    target: 10,
    cue: "Движение медленное и симметричное",
  },
  "Мелкая моторика": {
    mode: "hand",
    metric: "activity",
    target: 60,
    cue: "Держи руки в кадре, пальцы работают",
  },
  Растяжка: {
    mode: "hold",
    seconds: 25,
    rounds: 3,
    cue: "Тянем плавно, без боли",
  },
  "Баланс и координация": {
    mode: "hold",
    seconds: 10,
    rounds: 6,
    cue: "Держи равновесие, смотри вперёд",
  },
  "Дыхание и речь": {
    mode: "guide",
    seconds: 60,
    cue: "Плечи расслаблены, спина прямая",
  },
};

export function planFor(id: string, category: Category): CoachPlan {
  return coachPlans[id] ?? fallbackByCategory[category];
}
