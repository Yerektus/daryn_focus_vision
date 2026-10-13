"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Lock, LogOut, Pencil, RotateCcw, Sparkles, Star } from "lucide-react";
import { logout } from "@/app/auth-actions";
import { GMFCS_DISCLAIMER, gmfcsInfo, gmfcsRoman } from "@/data/gmfcs";
import { POSES, STICKERS, poseById } from "@/data/profile";
import { useExerciseStore } from "@/store/useExerciseStore";
import GmfcsDialog from "./GmfcsDialog";

const NAME_MAX = 30;

const longDate = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

const exercisesWord = (n: number) => plural(n, "упражнение", "упражнения", "упражнений");

/** Имя ребёнка прямо в заголовке: нажал, поправил, Enter или клик мимо сохраняет. */
function ChildName() {
  const childName = useExerciseStore((s) => s.childName);
  const setChildName = useExerciseStore((s) => s.setChildName);
  const [draft, setDraft] = useState(childName);

  const commit = () => {
    const next = draft.trim().replace(/\s+/g, " ").slice(0, NAME_MAX);
    setDraft(next);
    if (next !== childName) setChildName(next);
  };

  return (
    <label className="group flex min-w-0 items-center gap-2">
      <span className="sr-only">Имя ребёнка</span>
      <input
        value={draft}
        maxLength={NAME_MAX}
        placeholder="Как зовут ребёнка?"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(childName);
            // откат произойдёт до blur, поэтому сохранится старое имя
            requestAnimationFrame(() => (e.target as HTMLInputElement).blur());
          }
        }}
        className="heading-kid w-full min-w-0 rounded-2xl bg-transparent px-2 py-1 -ml-2 text-4xl leading-tight outline-none transition placeholder:text-ink/35 hover:bg-white/50 focus:bg-white/80 focus:ring-2 focus:ring-grape sm:text-5xl"
      />
      <Pencil
        className="size-5 shrink-0 text-ink/40 transition group-focus-within:opacity-0"
        strokeWidth={2.5}
        aria-hidden
      />
    </label>
  );
}

export default function ProfileBoard({
  name,
  email,
  createdAt,
}: {
  name: string;
  email: string;
  createdAt: number;
}) {
  const done = useExerciseStore((s) => s.done);
  const results = useExerciseStore((s) => s.results);
  const gmfcs = useExerciseStore((s) => s.gmfcs);
  const gmfcsSource = useExerciseStore((s) => s.gmfcsSource);
  const avatarId = useExerciseStore((s) => s.avatar);
  const setAvatar = useExerciseStore((s) => s.setAvatar);
  const resetProgress = useExerciseStore((s) => s.resetProgress);
  const [levelOpen, setLevelOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const doneCount = Object.keys(done).length;
  const unlocked = POSES.filter((p) => p.need <= doneCount);
  const latest = unlocked[unlocked.length - 1]!;
  const next = POSES.find((p) => p.need > doneCount);
  // после сброса прогресса закрытый образ не остаётся на аватаре
  const avatar = poseById(avatarId).need <= doneCount ? poseById(avatarId) : POSES[0]!;
  const toNext = next ? next.need - doneCount : 0;
  const nextPct = next ? ((doneCount - latest.need) / (next.need - latest.need)) * 100 : 100;

  const progress = { done, results, gmfcs };
  const earned = STICKERS.filter((s) => s.earned(progress)).length;

  return (
    <div className="px-1 py-2 sm:px-2 sm:py-4">
      {/* Шапка: аватар ребёнка и что говорит Барсик */}
      <section className="relative overflow-hidden rounded-[36px] bg-[#EADFFB] px-6 py-7 shadow-[0_6px_0_#CDB8F2] sm:px-10 sm:py-9">
        <Star
          className="kid-float absolute right-[8%] top-6 hidden size-6 text-sun sm:block"
          fill="currentColor"
          strokeWidth={0}
          aria-hidden
        />
        <Sparkles
          className="kid-float absolute bottom-8 right-[38%] hidden size-7 text-grape/50 [animation-delay:2s] sm:block"
          strokeWidth={2.5}
          aria-hidden
        />

        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <div className="flex size-40 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_6px_0_#CDB8F2] sm:size-48">
            <Image
              key={avatar.id}
              src={avatar.src}
              alt={`Барсик: ${avatar.title}`}
              width={avatar.width}
              height={avatar.height}
              className="barsik-pop size-32 object-contain sm:size-40"
              priority
            />
          </div>

          <div className="w-full min-w-0 flex-1">
            <ChildName />
            <p className="mt-1 text-sm font-semibold text-ink/55">
              Образ: «{avatar.title}» · {doneCount} {exercisesWord(doneCount)} пройдено
            </p>

            <p className="relative mt-4 rounded-3xl bg-white px-5 py-3 text-sm font-bold leading-relaxed text-ink shadow-[0_3px_0_#CDB8F2] before:absolute before:-top-2 before:left-10 before:size-4 before:rotate-45 before:bg-white sm:before:left-[-6px] sm:before:top-5">
              {latest.say}
            </p>

            {next ? (
              <div className="mt-4">
                <div className="flex justify-between gap-3 text-xs font-extrabold text-ink/60">
                  <span>Следующий образ: «{next.title}»</span>
                  <span className="shrink-0">
                    ещё {toNext} {exercisesWord(toNext)}
                  </span>
                </div>
                <div
                  className="mt-1.5 h-3 overflow-hidden rounded-full bg-white/70"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(nextPct)}
                  aria-label={`Прогресс до образа «${next.title}»`}
                >
                  <div
                    className="h-full rounded-full bg-grape transition-[width] duration-500"
                    style={{ width: `${Math.max(nextPct, 4)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm font-extrabold text-grape">
                Все образы Барсика открыты!
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Образы Барсика: открываются по прогрессу, открытый можно надеть */}
      <section className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="heading-kid text-2xl">Образы Барсика</h2>
          <p className="text-sm font-bold text-ink/55">
            Открыто {unlocked.length} из {POSES.length} · нажми, чтобы выбрать
          </p>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {POSES.map((p) => {
            const open = p.need <= doneCount;
            const selected = open && p.id === avatar.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={!open}
                  aria-pressed={selected}
                  onClick={() => setAvatar(p.id)}
                  className={`card-kid relative flex h-full w-full flex-col items-center p-3 text-center transition ${
                    selected
                      ? "!border-grape ring-2 ring-grape"
                      : open
                        ? "hover:-translate-y-0.5"
                        : "cursor-not-allowed"
                  }`}
                >
                  {selected && (
                    <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-grape text-white">
                      <Check className="size-4" strokeWidth={3} aria-hidden />
                    </span>
                  )}
                  <div className="relative flex h-28 w-full items-center justify-center">
                    <Image
                      src={p.src}
                      alt=""
                      width={p.width}
                      height={p.height}
                      className={`max-h-full w-auto object-contain ${
                        // закрытый образ виден силуэтом: интрига, кто там
                        open ? "" : "opacity-15 brightness-0"
                      }`}
                    />
                    {!open && (
                      <span className="absolute flex size-10 items-center justify-center rounded-full bg-ink/80 text-white">
                        <Lock className="size-5" strokeWidth={2.5} aria-hidden />
                      </span>
                    )}
                  </div>
                  <span className="mt-2 text-sm font-extrabold text-ink">{p.title}</span>
                  <span className="text-xs font-semibold text-ink/55">
                    {open
                      ? selected
                        ? "На аватаре"
                        : "Открыт"
                      : `${p.need} ${exercisesWord(p.need)}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Наклейки-достижения */}
      <section className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="heading-kid text-2xl">Наклейки</h2>
          <p className="text-sm font-bold text-ink/55">
            Собрано {earned} из {STICKERS.length}
          </p>
        </div>
        <ul className="card-kid mt-4 grid grid-cols-2 gap-x-3 gap-y-5 p-5 sm:grid-cols-5 sm:p-6">
          {STICKERS.map((s) => {
            const got = s.earned(progress);
            const Icon = s.icon;
            return (
              <li key={s.id} className="flex flex-col items-center text-center">
                <span
                  className={`flex size-16 items-center justify-center rounded-full ${
                    got
                      ? "-rotate-6 text-white shadow-[0_4px_0_rgb(0_0_0/0.15)] ring-4 ring-white"
                      : "border-2 border-dashed border-ink/20 text-ink/25"
                  }`}
                  style={got ? { backgroundColor: s.color } : undefined}
                >
                  {got ? (
                    <Icon className="size-7" strokeWidth={2.5} aria-hidden />
                  ) : (
                    <Lock className="size-5" strokeWidth={2.5} aria-hidden />
                  )}
                </span>
                <span className={`mt-2 text-sm font-extrabold ${got ? "text-ink" : "text-ink/45"}`}>
                  {s.title}
                </span>
                <span className="text-xs leading-snug text-ink/50">
                  {got ? "Получена!" : s.hint}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Взрослая часть: уровень и аккаунт */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="card-kid p-5 sm:p-6">
          <h2 className="heading-kid text-xl">Двигательный уровень</h2>
          {gmfcs ? (
            <>
              <p className="mt-3 flex items-center gap-3">
                <span className="heading-kid flex size-12 shrink-0 items-center justify-center rounded-2xl bg-chip text-2xl">
                  {gmfcsRoman[gmfcs]}
                </span>
                <span>
                  <span className="block font-extrabold text-ink">{gmfcsInfo[gmfcs].short}</span>
                  <span className="text-sm text-ink/55">
                    {gmfcsSource === "doctor" ? "Со слов врача" : "По опроснику Барсика"}
                  </span>
                </span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{gmfcsInfo[gmfcs].text}</p>
            </>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              Укажите уровень, и Барсик будет подбирать упражнения, которые
              подходят именно вашему ребёнку.
            </p>
          )}
          <p className="mt-3 text-xs text-ink/50">{GMFCS_DISCLAIMER}</p>
          <button
            type="button"
            onClick={() => setLevelOpen(true)}
            className="btn-kid mt-4 px-5 py-2.5 text-sm font-extrabold"
          >
            {gmfcs ? "Уточнить уровень" : "Указать уровень"}
          </button>
          <GmfcsDialog open={levelOpen} onClose={() => setLevelOpen(false)} />
        </section>

        <section className="card-kid flex flex-col p-5 sm:p-6">
          <h2 className="heading-kid text-xl">Аккаунт родителя</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="font-bold text-ink/55">Имя</dt>
            <dd className="truncate font-extrabold text-ink">{name}</dd>
            <dt className="font-bold text-ink/55">Почта</dt>
            <dd className="truncate font-extrabold text-ink">{email}</dd>
            <dt className="font-bold text-ink/55">С нами</dt>
            <dd className="font-extrabold text-ink">с {longDate.format(createdAt)}</dd>
          </dl>
          <p className="mt-3 text-xs text-ink/50">
            Прогресс, наклейки и образы хранятся только в этом браузере.
          </p>

          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {confirmReset ? (
              <>
                <span className="w-full text-sm font-bold text-ink/70">
                  Стереть упражнения, наклейки и образы?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    resetProgress();
                    setConfirmReset(false);
                  }}
                  className="pill-kid-active px-4 py-2.5 text-sm font-extrabold"
                >
                  Да, стереть
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="pill-kid px-4 py-2.5 text-sm font-extrabold"
                >
                  Отмена
                </button>
              </>
            ) : (
              <>
                {doneCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="pill-kid flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold"
                  >
                    <RotateCcw className="size-4" strokeWidth={2.5} aria-hidden />
                    Сбросить прогресс
                  </button>
                )}
                <form action={logout}>
                  <button
                    type="submit"
                    className="pill-kid flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold"
                  >
                    <LogOut className="size-4" strokeWidth={2.5} aria-hidden />
                    Выйти
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
