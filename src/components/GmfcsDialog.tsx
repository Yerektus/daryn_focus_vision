"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, X } from "lucide-react";
import {
  GMFCS_DISCLAIMER,
  GMFCS_LEVELS,
  QUIZ_START,
  gmfcsInfo,
  gmfcsQuiz,
  gmfcsRoman,
  type GmfcsLevel,
} from "@/data/gmfcs";
import { poseById } from "@/data/profile";
import { useExerciseStore } from "@/store/useExerciseStore";

/** Те же шаги, что у опросника в обучении (Tour.tsx) */
type Quiz =
  | { mode: "choose" }
  | { mode: "doctor" }
  | { mode: "questions"; history: string[] }
  | { mode: "result" };

const answerClass =
  "w-full rounded-2xl bg-chip px-4 py-3 text-left text-sm font-bold text-ink transition hover:bg-chip-hover";

/** Опросник GMFCS в модальном окне: без похода по страницам, как в обучении. */
export default function GmfcsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="gmfcs-dialog-title"
      // Esc и закрытие формой приходят сюда, состояние держит родитель
      onClose={onClose}
      // клик по затемнению: событие приходит на сам dialog
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-[28px] border-2 border-line bg-white p-0 text-ink shadow-[0_24px_60px_rgba(43,35,80,0.3)] backdrop:bg-[#2B2350]/55"
    >
      {/* содержимое монтируется заново при каждом открытии, опрос идёт с начала */}
      {open && <QuizBody onClose={onClose} />}
    </dialog>
  );
}

function QuizBody({ onClose }: { onClose: () => void }) {
  const gmfcs = useExerciseStore((s) => s.gmfcs);
  const gmfcsSource = useExerciseStore((s) => s.gmfcsSource);
  const setGmfcs = useExerciseStore((s) => s.setGmfcs);
  const [quiz, setQuiz] = useState<Quiz>({ mode: "choose" });

  const pickLevel = (level: GmfcsLevel, source: "doctor" | "quiz") => {
    setGmfcs(level, source);
    setQuiz({ mode: "result" });
  };

  const back = () => {
    if (quiz.mode === "questions" && quiz.history.length > 1) {
      setQuiz({ mode: "questions", history: quiz.history.slice(0, -1) });
    } else {
      setQuiz({ mode: "choose" });
    }
  };

  let title: string;
  let body: React.ReactNode;

  if (quiz.mode === "choose") {
    title =
      gmfcs !== null
        ? `Сейчас указан уровень ${gmfcsRoman[gmfcs]}${gmfcsSource === "doctor" ? " от врача" : " по опроснику"}. Оставим или уточним?`
        : "Знаете уровень GMFCS? Его обычно называет невролог или реабилитолог.";
    body = (
      <>
        {gmfcs !== null && (
          <button type="button" className={answerClass} onClick={onClose}>
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
      </>
    );
  } else if (quiz.mode === "doctor") {
    title = "Выберите уровень, который назвал врач";
    body = GMFCS_LEVELS.map((level) => (
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
    ));
  } else if (quiz.mode === "questions") {
    const question = gmfcsQuiz[quiz.history[quiz.history.length - 1]!]!;
    title = question.text;
    body = (
      <>
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
      </>
    );
  } else {
    const level = gmfcs ?? 1;
    title =
      gmfcsSource === "doctor"
        ? `Запомнил: уровень ${gmfcsRoman[level]}`
        : `Похоже на уровень ${gmfcsRoman[level]}`;
    body = (
      <>
        <div className="rounded-2xl bg-[#FFF8EC] p-4">
          <p className="text-xs font-extrabold text-ink/45">GMFCS {gmfcsRoman[level]}</p>
          <p className="mt-0.5 text-sm font-extrabold text-ink">{gmfcsInfo[level].short}</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-ink/70">
            {gmfcsInfo[level].text}
          </p>
          <p className="mt-2 rounded-xl bg-[#F7D68C]/70 px-3 py-2 text-xs font-semibold leading-relaxed text-[#4D3405]">
            {GMFCS_DISCLAIMER}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-kid px-5 py-2.5 text-sm font-extrabold"
          >
            Готово
          </button>
          <button
            type="button"
            className="text-sm font-bold text-ink/60 transition hover:text-ink"
            onClick={() => setQuiz({ mode: "choose" })}
          >
            Ответить заново
          </button>
        </div>
      </>
    );
  }

  // думает над вопросами, радуется результату
  const pose = poseById(quiz.mode === "result" ? "party" : "think");

  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Image
          key={title}
          src={pose.src}
          alt=""
          width={pose.width}
          height={pose.height}
          className="barsik-pop h-20 w-auto shrink-0 object-contain"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold text-ink/45">Двигательный уровень</p>
          <h2 id="gmfcs-dialog-title" className="heading-kid mt-1 text-lg leading-snug">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="pill-kid flex size-9 shrink-0 items-center justify-center"
        >
          <X className="size-5" strokeWidth={2.5} aria-hidden />
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">{body}</div>

      {(quiz.mode === "doctor" || quiz.mode === "questions") && (
        <button
          type="button"
          onClick={back}
          className="mt-3 flex items-center gap-1.5 px-1 text-sm font-bold text-ink/55 transition hover:text-ink"
        >
          <ArrowLeft className="size-4" strokeWidth={2.5} aria-hidden />
          Назад
        </button>
      )}
    </div>
  );
}
