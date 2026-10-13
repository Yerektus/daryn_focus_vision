"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Play, Volume2, VolumeX, X } from "lucide-react";
import { categoryStyles, exercises } from "@/data/exercises";
import {
  GMFCS_DISCLAIMER,
  GMFCS_LEVELS,
  QUIZ_START,
  gmfcsInfo,
  gmfcsQuiz,
  gmfcsRoman,
  pickPlan,
  type GmfcsLevel,
} from "@/data/gmfcs";
import { makeUtterance } from "@/lib/speech";
import { useExerciseStore } from "@/store/useExerciseStore";
import { useTourStore } from "@/store/useTourStore";
import { MASCOT_NAME } from "./Mascot";

type TourStep = {
  path: string;
  /** CSS-селектор подсвечиваемого элемента; нет значит без подсветки */
  target?: string;
  say: string;
  kind?: "quiz" | "plan";
  /** Подпись кнопки «Дальше» */
  nextLabel?: string;
};

/** Опросник GMFCS внутри тура: выбор пути, уровень от врача, вопросы, итог */
type Quiz =
  | { mode: "choose" }
  | { mode: "doctor" }
  | { mode: "questions"; history: string[] }
  | { mode: "result" };

type Spot = {
  target: string;
  top: number;
  left: number;
  width: number;
  height: number;
};

const answerClass =
  "w-full rounded-2xl bg-chip px-4 py-3 text-left text-sm font-bold text-ink transition hover:bg-chip-hover";
const primaryClass =
  "flex items-center gap-2 whitespace-nowrap btn-kid px-5 py-2.5 text-sm font-extrabold";

/** Обучение: Барсик ведёт по настоящим страницам и подсвечивает, куда смотреть. */
export default function Tour() {
  const active = useTourStore((s) => s.active);
  return active ? <ActiveTour /> : null;
}

function ActiveTour() {
  const { step, exerciseId, go, stop } = useTourStore();
  const gmfcs = useExerciseStore((s) => s.gmfcs);
  const gmfcsSource = useExerciseStore((s) => s.gmfcsSource);
  const done = useExerciseStore((s) => s.done);
  const setGmfcs = useExerciseStore((s) => s.setGmfcs);
  const pathname = usePathname();
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz>({ mode: "choose" });
  const [voiceOn, setVoiceOn] = useState(true);
  const [spot, setSpot] = useState<Spot | null>(null);

  const exercise = exercises.find((e) => e.id === exerciseId) ?? exercises[0];
  const exercisePath = `/exercise/${exercise.id}`;
  const plan = useMemo(() => pickPlan(gmfcs, done), [gmfcs, done]);

  // Реплика опросника зависит от того, на каком он шаге
  let quizSay: string;
  if (quiz.mode === "choose") {
    quizSay =
      gmfcs !== null
        ? `В профиле уже есть уровень GMFCS ${gmfcsRoman[gmfcs]}${gmfcsSource === "doctor" ? " от врача" : ", я определил его по вашим ответам"}. Оставим или уточним?`
        : "Расскажите немного о ребёнке, чтобы я подобрал упражнения. Знаете уровень GMFCS? Его обычно называет невролог или реабилитолог.";
  } else if (quiz.mode === "doctor") {
    quizSay = "Выберите уровень, который назвал врач.";
  } else if (quiz.mode === "questions") {
    quizSay = gmfcsQuiz[quiz.history[quiz.history.length - 1]].text;
  } else {
    const level = gmfcs ?? 1;
    quizSay =
      gmfcsSource === "doctor"
        ? `Запомнил: уровень ${gmfcsRoman[level]}. Отмечу подходящие упражнения и предупрежу о слишком сложных.`
        : `Похоже на уровень ${gmfcsRoman[level]}: ${gmfcsInfo[level].short.toLowerCase()}. Отмечу подходящие упражнения и предупрежу о слишком сложных.`;
  }

  const steps: TourStep[] = [
    {
      path: "/",
      say: `Привет! Я ${MASCOT_NAME}, снежный барсёнок. Покажу, как здесь всё устроено: пройдёмся по страницам вместе, это пара минут.`,
      nextLabel: "Пойдём!",
    },
    {
      path: "/",
      target: '[data-tour="nav"]',
      say: "Наверху разделы: «Упражнения» и «Аналитика». А кнопка «Обучение» снова позовёт меня.",
    },
    { path: "/", kind: "quiz", say: quizSay },
    {
      path: "/",
      target: '[data-tour="filters"]',
      say:
        gmfcs !== null
          ? "Здесь поиск и фильтры по виду и сложности. Кнопку «Подходят ребёнку» я уже включил: остались упражнения для вашего уровня."
          : "Здесь поиск и фильтры по виду и сложности упражнений.",
    },
    {
      path: "/",
      target: '[data-tour="cards"] > li:first-child',
      say: "На карточке направление, время, сложность и возраст. Пройденные упражнения я отмечаю галочкой. Давайте откроем одно!",
      nextLabel: "Открыть упражнение",
    },
    {
      path: exercisePath,
      target: '[data-tour="steps"]',
      say: `Это «${exercise.title}». Здесь пошагово, как выполнять: прочитайте шаги до начала занятия.`,
    },
    {
      path: exercisePath,
      target: '[data-tour="safety"]',
      say: "Рядом инвентарь и совет. И самое важное: прекращайте занятие при боли, усилении спастики, судорогах или изменении дыхания.",
    },
    {
      path: exercisePath,
      target: '[data-tour="start"]',
      say: "Когда будете готовы, нажмите «Начать упражнение». Я появлюсь на экране камеры, отсчитаю «три, два, один», посчитаю повторения и подскажу голосом. Камеру ставьте в 2–3 метрах.",
      nextLabel: "А что потом?",
    },
    {
      path: "/analytics",
      target: '[data-tour="stats"]',
      say: "После занятий здесь виден прогресс: сколько пройдено, активность по дням и направлениям. Данные хранятся только в этом браузере.",
    },
    {
      path: "/",
      kind: "plan",
      say:
        plan.length > 0
          ? "Вот и всё! На сегодня предлагаю эти упражнения. На камере я буду рядом."
          : "Вот и всё! Подходящие упражнения уже пройдены, можно повторить любимые.",
    },
  ];

  const index = Math.min(step, steps.length - 1);
  const current = steps[index];
  const onPage = pathname === current.path;
  const last = index === steps.length - 1;

  const goTo = (to: number) => {
    if (steps[to]?.kind === "quiz") setQuiz({ mode: "choose" });
    go(to);
  };

  const pickLevel = (level: GmfcsLevel, source: "doctor" | "quiz") => {
    setGmfcs(level, source);
    setQuiz({ mode: "result" });
  };

  // Барсик сам ведёт на страницу текущего шага
  useEffect(() => {
    if (!onPage) router.push(current.path);
  }, [current.path, onPage, router]);

  // Следим за подсвеченным элементом каждый кадр: страница догружается,
  // прокручивается и меняет размер, а рамка должна оставаться на месте.
  useEffect(() => {
    const target = current.target;
    if (!target || !onPage) return;
    let raf = 0;
    let scrolled = false;
    let lastKey = "";
    const tick = () => {
      const el = document.querySelector(target);
      if (el) {
        if (!scrolled) {
          scrolled = true;
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
        }
        const r = el.getBoundingClientRect();
        const key = `${r.top}|${r.left}|${r.width}|${r.height}`;
        if (key !== lastKey) {
          lastKey = key;
          setSpot({ target, top: r.top, left: r.left, width: r.width, height: r.height });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current.target, onPage]);

  // Шаги без подсветки начинаются с верха страницы
  useEffect(() => {
    if (onPage && !current.target) window.scrollTo({ top: 0 });
  }, [current.target, onPage]);

  // Барсик читает реплику вслух
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth || !voiceOn || !onPage) return;
    synth.cancel();
    synth.speak(makeUtterance(current.say));
  }, [current.say, onPage, voiceOn]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [stop]);

  const shown = spot && onPage && spot.target === current.target ? spot : null;
  // если подсветка в нижней половине экрана, Барсик переходит наверх
  const cardOnTop =
    shown !== null &&
    typeof window !== "undefined" &&
    shown.top + shown.height / 2 > window.innerHeight / 2;

  let body: ReactNode = null;
  let canForward = true;

  if (current.kind === "quiz") {
    if (quiz.mode === "choose") {
      canForward = false;
      body = (
        <div className="flex flex-col gap-2">
          {gmfcs !== null && (
            <button type="button" className={answerClass} onClick={() => goTo(index + 1)}>
              Оставить уровень {gmfcsRoman[gmfcs]}
            </button>
          )}
          <button type="button" className={answerClass} onClick={() => setQuiz({ mode: "doctor" })}>
            Да, врач называл уровень
          </button>
          <button
            type="button"
            className={answerClass}
            onClick={() => setQuiz({ mode: "questions", history: [QUIZ_START] })}
          >
            Не знаю, давай определим по вопросам
          </button>
          <button
            type="button"
            className="w-fit px-1 py-1 text-sm font-bold text-ink/45 transition hover:text-ink/80"
            onClick={() => goTo(index + 1)}
          >
            Пропустить
          </button>
        </div>
      );
    } else if (quiz.mode === "doctor") {
      canForward = false;
      body = (
        <div className="flex flex-col gap-2">
          {GMFCS_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              className={answerClass}
              onClick={() => pickLevel(level, "doctor")}
            >
              <span className="flex items-baseline gap-3">
                <span className="w-7 shrink-0 font-extrabold">{gmfcsRoman[level]}</span>
                <span>
                  {gmfcsInfo[level].short}
                  <span className="mt-0.5 block text-xs font-medium leading-relaxed text-ink/60">
                    {gmfcsInfo[level].text}
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
      );
    } else if (quiz.mode === "questions") {
      canForward = false;
      const question = gmfcsQuiz[quiz.history[quiz.history.length - 1]];
      body = (
        <div className="flex flex-col gap-2">
          <p className="px-1 text-xs font-bold text-ink/45">
            Вопрос {quiz.history.length}. Отвечайте, как ребёнок двигается обычно.
          </p>
          {question.answers.map((answer) => (
            <button
              key={answer.label}
              type="button"
              className={answerClass}
              onClick={() =>
                typeof answer.next === "number"
                  ? pickLevel(answer.next, "quiz")
                  : setQuiz({ mode: "questions", history: [...quiz.history, answer.next] })
              }
            >
              {answer.label}
            </button>
          ))}
        </div>
      );
    } else {
      const level = gmfcs ?? 1;
      body = (
        <div className="rounded-2xl bg-[#FFF8EC] p-4">
          <p className="text-xs font-extrabold text-ink/45">GMFCS {gmfcsRoman[level]}</p>
          <p className="mt-0.5 text-sm font-extrabold text-ink">{gmfcsInfo[level].short}</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-ink/70">
            {gmfcsInfo[level].text}
          </p>
          <p className="mt-2 rounded-xl bg-[#F7D68C]/70 px-3 py-2 text-xs font-semibold leading-relaxed text-[#4D3405]">
            {GMFCS_DISCLAIMER}
          </p>
          <button
            type="button"
            className="mt-2 text-xs font-bold text-ink/60 transition hover:text-ink"
            onClick={() => setQuiz({ mode: "choose" })}
          >
            Ответить заново
          </button>
        </div>
      );
    }
  }

  if (current.kind === "plan") {
    body = (
      <div className="flex flex-col gap-2">
        {plan.map((e, i) => {
          const s = categoryStyles[e.category];
          return (
            <Link
              key={e.id}
              href={`/exercise/${e.id}`}
              onClick={stop}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:-translate-y-0.5"
              style={{ backgroundColor: s.bg, color: s.ink }}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-extrabold">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold">{e.title}</span>
                <span className="block text-xs font-bold opacity-70">
                  {e.category} · {e.duration} мин
                </span>
              </span>
              <Play className="size-4 shrink-0" fill="currentColor" aria-hidden />
            </Link>
          );
        })}
      </div>
    );
  }

  const back = () => {
    if (current.kind === "quiz" && quiz.mode === "questions" && quiz.history.length > 1) {
      setQuiz({ mode: "questions", history: quiz.history.slice(0, -1) });
    } else if (current.kind === "quiz" && quiz.mode !== "choose") {
      setQuiz({ mode: "choose" });
    } else {
      goTo(index - 1);
    }
  };

  return (
    <>
      {/* затемнение с «окном» над подсвеченным элементом; клики по странице
          во время тура перехватываем, чтобы случайно не уйти с шага */}
      <div className="fixed inset-0 z-[90]" aria-hidden>
        {shown ? (
          <div
            className="absolute rounded-[26px] ring-4 ring-sun transition-all duration-300 ease-out"
            style={{
              top: shown.top - 8,
              left: shown.left - 8,
              width: shown.width + 16,
              height: shown.height + 16,
              boxShadow: "0 0 0 9999px rgba(20, 20, 20, 0.55)",
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-[#2B2350]/55 transition-colors" />
        )}
      </div>

      <div
        role="dialog"
        aria-label={`Обучение с ${MASCOT_NAME}ом`}
        className={`fixed inset-x-3 z-[95] rounded-[28px] bg-white p-4 border-2 border-line shadow-[0_24px_60px_rgba(43,35,80,0.3)] sm:inset-x-auto sm:right-6 sm:w-[28rem] sm:p-5 ${
          cardOnTop ? "top-3 sm:top-6" : "bottom-3 sm:bottom-6"
        }`}
      >
        <div className="flex gap-3">
          {/* key перезапускает «подпрыгивание» на каждой новой реплике */}
          <Image
            key={current.say}
            src="/mascot/barsik.webp"
            alt=""
            width={496}
            height={640}
            className="barsik-pop h-auto w-16 shrink-0 self-start sm:w-24"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-extrabold text-ink/45">
                {MASCOT_NAME} · {index + 1} из {steps.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-pressed={voiceOn}
                  aria-label={voiceOn ? "Выключить голос" : "Включить голос"}
                  onClick={() => {
                    if (voiceOn) window.speechSynthesis?.cancel();
                    setVoiceOn(!voiceOn);
                  }}
                  className="flex size-8 items-center justify-center rounded-full text-ink/60 transition hover:bg-chip hover:text-ink"
                >
                  {voiceOn ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
                </button>
                <button
                  type="button"
                  aria-label="Закончить обучение"
                  onClick={stop}
                  className="flex size-8 items-center justify-center rounded-full text-ink/60 transition hover:bg-chip hover:text-ink"
                >
                  <X className="size-4" strokeWidth={2.5} aria-hidden />
                </button>
              </div>
            </div>
            <p
              className="mt-1 text-[15px] font-bold leading-relaxed text-ink"
              aria-live="polite"
            >
              {current.say}
            </p>
          </div>
        </div>

        {body && <div className="mt-3 max-h-[42vh] overflow-y-auto">{body}</div>}

        <div className="mt-4 flex items-center justify-end gap-2 sm:justify-between">
          <div className="hidden gap-1 sm:flex" aria-hidden>
            {steps.map((s, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-grape" : "w-1.5 bg-grape/20"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            {index > 0 && (
              <button
                type="button"
                onClick={back}
                aria-label="Назад"
                className="flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-bold text-ink/60 transition hover:text-ink"
              >
                <ArrowLeft className="size-4" strokeWidth={3} aria-hidden />
                <span className="max-sm:hidden">Назад</span>
              </button>
            )}
            {last ? (
              <button type="button" onClick={stop} className={primaryClass}>
                Готово
              </button>
            ) : (
              canForward && (
                <button type="button" onClick={() => goTo(index + 1)} className={primaryClass}>
                  {current.nextLabel ?? "Дальше"}
                  <ArrowRight className="size-4" strokeWidth={3} aria-hidden />
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
