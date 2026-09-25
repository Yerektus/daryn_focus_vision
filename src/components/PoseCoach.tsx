"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bot,
  BotOff,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  DrawingUtils,
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import type { CoachPlan } from "@/data/coach";
import type { Exercise } from "@/data/exercises";
import { categoryStyles } from "@/data/exercises";
import { useExerciseStore } from "@/store/useExerciseStore";

type Status = "idle" | "loading" | "live" | "error";

type Metrics = {
  inFrame: boolean;
  kneeAngle: number;
  hipAngle: number;
  elbowAngle: number;
  /** Разворот линии плеч относительно линии таза, градусы */
  torsoRotation: number;
  shoulderTilt: number;
  hipTilt: number;
  motion: number;
};

/** Спокойный темп и чуть более высокий тон: так системный голос звучит мягче. */
const SPEECH_RATE = 0.9;
const SPEECH_PITCH = 1.15;

/** Chrome по умолчанию берёт сетевой голос Google, он звучит суховато и
 *  зависит от сети. Предпочитаем локальный системный голос (на macOS Милена). */
function pickRussianVoice() {
  const all = window.speechSynthesis?.getVoices() ?? [];
  const russian = all.filter((v) => v.lang.toLowerCase().startsWith("ru"));
  return russian.find((v) => v.localService) ?? russian[0] ?? null;
}

/** Счёт вслух: до двадцати проговариваем словами, дальше числом. */
const COUNT_WORDS = [
  "раз",
  "два",
  "три",
  "четыре",
  "пять",
  "шесть",
  "семь",
  "восемь",
  "девять",
  "десять",
  "одиннадцать",
  "двенадцать",
  "тринадцать",
  "четырнадцать",
  "пятнадцать",
  "шестнадцать",
  "семнадцать",
  "восемнадцать",
  "девятнадцать",
  "двадцать",
];

function countWord(value: number) {
  return COUNT_WORDS[value - 1] ?? String(value);
}

/** Минимальный размах метрики, ниже которого считать повторения нельзя. */
const MIN_HAND_SPAN = 0.18;

/** Счёт повторений по адаптивным порогам: следим за наблюдаемым размахом
 *  метрики и считаем переход от нижней трети к верхней. */
function countHandRep(
  value: number,
  range: { min: number; max: number; since: number },
  phase: "open" | "closed" | "unknown",
): { phase: "open" | "closed" | "unknown"; rep: boolean; weak: boolean } {
  range.min = Math.min(range.min, value);
  range.max = Math.max(range.max, value);

  const span = range.max - range.min;
  // медленно сжимаем границы, иначе один случайный выброс задерёт диапазон
  if (Number.isFinite(span) && span > 0) {
    range.min += span * 0.0004;
    range.max -= span * 0.0004;
  }
  if (span < MIN_HAND_SPAN) return { phase, rep: false, weak: true };

  const low = range.min + span * 0.35;
  const high = range.min + span * 0.65;

  if (value <= low && phase !== "closed") {
    return { phase: "closed", rep: false, weak: false };
  }
  if (value >= high && phase === "closed") {
    return { phase: "open", rep: true, weak: false };
  }
  return { phase, rep: false, weak: false };
}

/** Раскрытость кисти: среднее расстояние кончиков пальцев до запястья,
 *  нормированное на размер ладони. Кулак примерно 1.3, открытая ладонь около 2.4. */
function handOpenness(hand: NormalizedLandmark[]) {
  const wrist = hand[0];
  const scale = Math.hypot(hand[9].x - wrist.x, hand[9].y - wrist.y) || 0.001;
  const tips = [8, 12, 16, 20];
  const sum = tips.reduce(
    (acc, i) => acc + Math.hypot(hand[i].x - wrist.x, hand[i].y - wrist.y),
    0,
  );
  return sum / tips.length / scale;
}

/** Щепоть: расстояние между большим и указательным пальцами. */
function pinchDistance(hand: NormalizedLandmark[]) {
  const scale =
    Math.hypot(hand[9].x - hand[0].x, hand[9].y - hand[0].y) || 0.001;
  return Math.hypot(hand[4].x - hand[8].x, hand[4].y - hand[8].y) / scale;
}

/** Разворот корпуса: угол между линией плеч и линией таза сверху (плоскость XZ). */
function torsoRotationOf(world: NormalizedLandmark[]) {
  const shoulder = { x: world[12].x - world[11].x, z: world[12].z - world[11].z };
  const hip = { x: world[24].x - world[23].x, z: world[24].z - world[23].z };
  const n1 = Math.hypot(shoulder.x, shoulder.z);
  const n2 = Math.hypot(hip.x, hip.z);
  if (n1 === 0 || n2 === 0) return 0;
  const cos = (shoulder.x * hip.x + shoulder.z * hip.z) / (n1 * n2);
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
}

const EMPTY: Metrics = {
  inFrame: false,
  kneeAngle: 0,
  hipAngle: 0,
  elbowAngle: 0,
  torsoRotation: 0,
  shoulderTilt: 0,
  hipTilt: 0,
  motion: 0,
};

/** Угол ABC в градусах по трём точкам (3D-координаты в метрах). */
function angleAt(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark,
) {
  const v1 = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const n1 = Math.hypot(v1.x, v1.y, v1.z);
  const n2 = Math.hypot(v2.x, v2.y, v2.z);
  if (n1 === 0 || n2 === 0) return 0;
  return (Math.acos(Math.min(1, Math.max(-1, dot / (n1 * n2)))) * 180) / Math.PI;
}

export default function PoseCoach({
  exercise,
  plan,
}: {
  exercise: Exercise;
  plan: CoachPlan;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loopRef = useRef<() => void>(() => {});
  const stopRef = useRef<() => void>(() => {});
  const repsRef = useRef(0);
  const roundsRef = useRef(0);

  const metricsRef = useRef<Metrics>(EMPTY);
  const prevLandmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const phaseRef = useRef<"up" | "down" | "unknown">("unknown");
  const handPhaseRef = useRef<"open" | "closed" | "unknown">("unknown");
  /** Наблюдаемый размах метрики кисти: пороги подстраиваются под ребёнка,
   *  ведь с мячом в ладони пальцы сжимаются далеко не до кулака. */
  const handRangeRef = useRef({ min: Infinity, max: -Infinity, since: 0 });
  const handActivityRef = useRef({ seconds: 0, last: 0, prev: 0 });
  const holdRef = useRef({ seconds: 0, last: 0 });
  const spokenRef = useRef({ text: "", at: 0 });
  const voiceOnRef = useRef(true);
  const aiOnRef = useRef(true);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const completedRef = useRef(false);
  const guideRef = useRef({ seconds: 0, last: 0 });
  // Счётчики за занятие: из них собирается разбор на странице результата
  const statsRef = useRef({
    startedAt: 0,
    frames: 0,
    outOfFrame: 0,
    shoulderTilt: 0,
    hipTilt: 0,
    unstable: 0,
    shallowReps: 0,
    peakAngle: 0,
  });

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [reps, setReps] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [hint, setHint] = useState(plan.cue);
  const [voiceOn, setVoiceOn] = useState(true);
  const [aiOn, setAiOn] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [guideSeconds, setGuideSeconds] = useState(0);
  const [handsVisible, setHandsVisible] = useState(false);

  const markDone = useExerciseStore((s) => s.markDone);
  const saveResult = useExerciseStore((s) => s.saveResult);
  const router = useRouter();

  const style = categoryStyles[exercise.category];
  const overlayOpen = status === "loading" || status === "live";

  // список голосов приходит асинхронно, поэтому слушаем voiceschanged
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const read = () => {
      voiceRef.current = pickRussianVoice();
    };
    read();
    synth.addEventListener("voiceschanged", read);
    return () => synth.removeEventListener("voiceschanged", read);
  }, []);

  const speak = useCallback((text: string, urgent = false) => {
    if (!voiceOnRef.current || typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    const now = Date.now();
    const gap = urgent ? 2500 : 6000;
    if (spokenRef.current.text === text && now - spokenRef.current.at < 20000)
      return;
    if (now - spokenRef.current.at < gap) return;
    spokenRef.current = { text, at: now };

    if (urgent) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ru-RU";
    utterance.rate = SPEECH_RATE;
    utterance.pitch = SPEECH_PITCH;
    if (voiceRef.current) utterance.voice = voiceRef.current;
    synth.speak(utterance);
  }, []);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    const st = statsRef.current;
    const frames = Math.max(1, st.frames);
    const pct = (value: number) => Math.round((value / frames) * 100);

    saveResult({
      exerciseId: exercise.id,
      at: Date.now(),
      seconds: Math.round((Date.now() - st.startedAt) / 1000),
      mode: plan.mode,
      reps: repsRef.current,
      rounds: roundsRef.current,
      guideSeconds: Math.round(
        plan.mode === "hand"
          ? handActivityRef.current.seconds
          : guideRef.current.seconds,
      ),
      inFramePct: 100 - pct(st.outOfFrame),
      shoulderTiltPct: pct(st.shoulderTilt),
      hipTiltPct: pct(st.hipTilt),
      shallowReps: st.shallowReps,
      unstablePct: pct(st.unstable),
    });
    markDone(exercise.id);
    setCompleted(true);
    speak("Упражнение засчитано, молодец", true);

    // даём увидеть плашку, затем уходим на разбор
    window.setTimeout(() => {
      stopRef.current();
      router.push(`/exercise/${exercise.id}/result`);
    }, 1600);
  }, [exercise.id, markDone, plan.mode, router, saveResult, speak]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    aiTimerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
    }
    window.speechSynthesis?.cancel();
    setStatus("idle");
    metricsRef.current = EMPTY;
    prevLandmarksRef.current = null;
    phaseRef.current = "unknown";
  }, []);

  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  useEffect(() => stop, [stop]);

  // Пока камера открыта на весь экран, страница под ней не скроллится
  useEffect(() => {
    if (!overlayOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [overlayOpen, stop]);

  const askClaude = useCallback(async () => {
    if (!aiOnRef.current) return;
    const m = metricsRef.current;
    if (!m.inFrame) return;
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: {
            title: exercise.title,
            goal: exercise.goal,
            cue: plan.cue,
            mode: plan.mode,
          },
          metrics: {
            уголКолена: Math.round(m.kneeAngle),
            уголБедра: Math.round(m.hipAngle),
            уголЛоктя: Math.round(m.elbowAngle),
            поворотКорпуса: Math.round(m.torsoRotation),
            перекосПлеч: +m.shoulderTilt.toFixed(3),
            перекосТаза: +m.hipTilt.toFixed(3),
            подвижность: +m.motion.toFixed(3),
            повторений: reps,
            кругов: rounds,
          },
        }),
      });
      // подсказка ИИ только звучит, на экране её не показываем
      if (!res.ok) return;
      const data = (await res.json()) as { hint?: string };
      if (data.hint) speak(data.hint);
    } catch {
      // молча остаёмся на локальных подсказках
    }
  }, [exercise.goal, exercise.title, plan.cue, plan.mode, reps, rounds, speak]);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    const handLandmarker = handLandmarkerRef.current;
    if (!video || !canvas) return;
    if (plan.mode === "hand" ? !handLandmarker : !landmarker) return;

    if (video.readyState >= 2 && video.videoWidth > 0) {
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      if (plan.mode === "hand" && handLandmarker) {
        const handResult = handLandmarker.detectForVideo(
          video,
          performance.now(),
        );
        const ctx = canvas.getContext("2d");
        const hands = handResult.landmarks;

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const utils = new DrawingUtils(ctx);
          for (const hand of hands) {
            utils.drawConnectors(hand, HandLandmarker.HAND_CONNECTIONS, {
              color: "rgba(255,255,255,0.85)",
              lineWidth: 4,
            });
            utils.drawLandmarks(hand, { color: style.mark, radius: 5 });
          }
        }

        const st = statsRef.current;
        st.frames += 1;
        const seen = hands.length > 0;
        if (!seen) st.outOfFrame += 1;
        metricsRef.current = { ...metricsRef.current, inFrame: seen };
        setHandsVisible(seen);

        let handHint = plan.cue;
        if (!seen) {
          handHint = "Покажи руки в кадр, ладони видно целиком";
        } else if (plan.metric === "squeeze" || plan.metric === "pinch") {
          const value =
            plan.metric === "squeeze"
              ? Math.min(...hands.map(handOpenness))
              : Math.min(...hands.map(pinchDistance));

          const step = countHandRep(
            value,
            handRangeRef.current,
            handPhaseRef.current,
          );
          handPhaseRef.current = step.phase;

          if (step.weak) {
            handHint =
              plan.metric === "squeeze"
                ? "Сжимай сильнее и разжимай пальцы полностью"
                : "Раскрывай прищепку шире, пальцы разводи до конца";
          } else if (step.phase === "closed") {
            handHint =
              plan.metric === "squeeze"
                ? "Держи сжатие на счёт три"
                : "Держи захват и переноси прищепку";
          }

          if (step.rep) {
            setReps((r) => {
              const next = r + 1;
              repsRef.current = next;
              if (next >= plan.target) complete();
              else speak(countWord(next), true);
              return next;
            });
          }
        } else {
          // activity: считаем время, пока пальцы действительно двигаются
          const now = performance.now();
          const state = handActivityRef.current;
          const openness = handOpenness(hands[0]);
          const moved = Math.abs(openness - state.prev) > 0.02;
          state.prev = openness;
          const last = state.last;
          state.last = now;
          if (moved && last) {
            state.seconds += (now - last) / 1000;
            setGuideSeconds(state.seconds);
            if (state.seconds >= plan.target) complete();
          } else if (!moved) {
            handHint = "Работай пальцами активнее";
          }
        }

        setHint(handHint);
        speak(handHint, !seen);
        rafRef.current = requestAnimationFrame(() => loopRef.current());
        return;
      }

      if (!landmarker) return;
      const result = landmarker.detectForVideo(video, performance.now());
      const ctx = canvas.getContext("2d");
      const lm = result.landmarks[0];
      const world = result.worldLandmarks[0];

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (lm) {
          const utils = new DrawingUtils(ctx);
          utils.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, {
            color: "rgba(255,255,255,0.85)",
            lineWidth: 4,
          });
          utils.drawLandmarks(lm, { color: style.mark, radius: 5 });
        }
      }

      if (lm && world) {
        const key = [11, 12, 23, 24, 25, 26];
        const seen = key.filter((i) => (lm[i]?.visibility ?? 1) > 0.5).length;
        const inFrame = seen >= 5;

        const kneeAngle =
          (angleAt(world[23], world[25], world[27]) +
            angleAt(world[24], world[26], world[28])) /
          2;
        const hipAngle =
          (angleAt(world[11], world[23], world[25]) +
            angleAt(world[12], world[24], world[26])) /
          2;
        const elbowAngle =
          (angleAt(world[11], world[13], world[15]) +
            angleAt(world[12], world[14], world[16])) /
          2;
        const torsoRotation = torsoRotationOf(world);

        let motion = 0;
        const prev = prevLandmarksRef.current;
        if (prev) {
          for (const i of key)
            motion += Math.hypot(lm[i].x - prev[i].x, lm[i].y - prev[i].y);
          motion /= key.length;
        }
        prevLandmarksRef.current = lm;

        const next: Metrics = {
          inFrame,
          kneeAngle,
          hipAngle,
          elbowAngle,
          torsoRotation,
          shoulderTilt: Math.abs(lm[11].y - lm[12].y),
          hipTilt: Math.abs(lm[23].y - lm[24].y),
          motion,
        };
        metricsRef.current = next;

        const st = statsRef.current;
        st.frames += 1;
        if (!inFrame) st.outOfFrame += 1;
        if (next.shoulderTilt > 0.06) st.shoulderTilt += 1;
        if (next.hipTilt > 0.06) st.hipTilt += 1;

        // Приоритет подсказок: попасть в кадр, затем симметрия, затем техника.
        let localHint = plan.cue;
        let urgent = false;
        if (!inFrame) {
          localHint = "Отойди чуть дальше, чтобы попасть в кадр целиком";
          urgent = true;
        } else if (next.shoulderTilt > 0.06) {
          localHint = "Выровняй плечи, одно выше другого";
          urgent = true;
        } else if (next.hipTilt > 0.06) {
          localHint = "Не заваливайся на бок, таз ровнее";
          urgent = true;
        }

        if (plan.mode === "reps" && inFrame) {
          const angle =
            plan.joint === "knee"
              ? kneeAngle
              : plan.joint === "hip"
                ? hipAngle
                : plan.joint === "torso"
                  ? torsoRotation
                  : elbowAngle;
          const st = statsRef.current;
          st.peakAngle = Math.max(st.peakAngle, angle);
          if (angle < plan.downAngle) {
            // вернулись вниз, так и не выпрямившись до конца
            if (
              phaseRef.current === "down" &&
              st.peakAngle > plan.downAngle + 10 &&
              st.peakAngle < plan.upAngle
            ) {
              st.shallowReps += 1;
            }
            st.peakAngle = 0;
            phaseRef.current = "down";
          }
          if (angle > plan.upAngle && phaseRef.current === "down") {
            phaseRef.current = "up";
            statsRef.current.peakAngle = 0;
            setReps((r) => {
              const value = r + 1;
              repsRef.current = value;
              if (value >= plan.target) complete();
              else speak(countWord(value), true);
              return value;
            });
          }
        }

        if (plan.mode === "hold") {
          const now = performance.now();
          const stable = inFrame && motion < 0.012;
          const last = holdRef.current.last;
          holdRef.current.last = now;
          if (stable && last) {
            holdRef.current.seconds += (now - last) / 1000;
            if (holdRef.current.seconds >= plan.seconds) {
              holdRef.current.seconds = 0;
              setRounds((value) => {
                const next = value + 1;
                roundsRef.current = next;
                if (next >= plan.rounds) complete();
                else speak("Хорошо, отдохни и повтори", true);
                return next;
              });
            }
            setHoldSeconds(holdRef.current.seconds);
          } else if (!stable) {
            if (inFrame) statsRef.current.unstable += 1;
            if (holdRef.current.seconds > 0.5) localHint = "Замри и держи позу";
            holdRef.current.seconds = 0;
            setHoldSeconds(0);
          }
        }

        if (plan.mode === "guide") {
          const now = performance.now();
          const last = guideRef.current.last;
          guideRef.current.last = now;
          if (inFrame && last) {
            guideRef.current.seconds += (now - last) / 1000;
            setGuideSeconds(guideRef.current.seconds);
            if (guideRef.current.seconds >= plan.seconds) complete();
          }
        }

        setHint(localHint);
        speak(localHint, urgent);
      }
    }

    rafRef.current = requestAnimationFrame(() => loopRef.current());
  }, [complete, plan, speak, style.mark]);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  const start = useCallback(async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setError(
        "Браузер не даёт доступ к камере. Нужен https или localhost и современный браузер.",
      );
      return;
    }

    setStatus("loading");
    try {
      const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      if (plan.mode === "hand") {
        if (!handLandmarkerRef.current) {
          handLandmarkerRef.current = await HandLandmarker.createFromOptions(
            fileset,
            {
              baseOptions: {
                modelAssetPath: "/models/hand_landmarker.task",
                delegate: "GPU",
              },
              runningMode: "VIDEO",
              numHands: 2,
              minHandDetectionConfidence: 0.4,
              minHandPresenceConfidence: 0.4,
              minTrackingConfidence: 0.4,
            },
          );
        }
      } else if (!landmarkerRef.current) {
        landmarkerRef.current = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: "/models/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      holdRef.current = { seconds: 0, last: 0 };
      guideRef.current = { seconds: 0, last: 0 };
      handActivityRef.current = { seconds: 0, last: 0, prev: 0 };
      handPhaseRef.current = "unknown";
      setHandsVisible(false);
      handRangeRef.current = { min: Infinity, max: -Infinity, since: Date.now() };
      completedRef.current = false;
      repsRef.current = 0;
      roundsRef.current = 0;
      statsRef.current = {
        startedAt: Date.now(),
        frames: 0,
        outOfFrame: 0,
        shoulderTilt: 0,
        hipTilt: 0,
        unstable: 0,
        shallowReps: 0,
        peakAngle: 0,
      };
      setCompleted(false);
      setReps(0);
      setRounds(0);
      setHoldSeconds(0);
      setGuideSeconds(0);
      setStatus("live");

      rafRef.current = requestAnimationFrame(() => loopRef.current());
      aiTimerRef.current = setInterval(() => void askClaude(), 12000);
      speak(`Начинаем. ${plan.cue}`, true);
    } catch (err) {
      setStatus("error");
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotAllowedError"
          ? "Доступ к камере запрещён. Разрешите камеру в настройках браузера."
          : name === "NotFoundError"
            ? "Камера не найдена."
            : "Не удалось запустить камеру и распознавание позы.",
      );
    }
  }, [askClaude, plan, speak]);

  const progressLabel =
    plan.mode === "reps"
      ? `${reps} / ${plan.target}`
      : plan.mode === "hold"
        ? `${holdSeconds.toFixed(0)} / ${plan.seconds} с`
        : plan.mode === "hand"
          ? plan.metric === "activity"
            ? `${Math.min(guideSeconds, plan.target).toFixed(0)} / ${plan.target} с`
            : `${reps} / ${plan.target}`
          : `${Math.min(guideSeconds, plan.seconds).toFixed(0)} / ${plan.seconds} с`;

  const progressCaption =
    plan.mode === "reps"
      ? "повторений"
      : plan.mode === "hold"
        ? `круг ${Math.min(rounds + 1, plan.rounds)} из ${plan.rounds}`
        : plan.mode === "hand"
          ? plan.metric === "squeeze"
            ? "сжиманий кисти"
            : plan.metric === "pinch"
              ? "захватов пальцами"
              : "секунд активной работы пальцев"
          : "время занятия";

  return (
    <>
      <section className="flex flex-col items-center rounded-[28px] bg-white px-6 py-10 text-center sm:py-14">
        <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          Готовы начать?
        </h2>
        <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-neutral-500">
          {plan.cue}. Камера откроется на весь экран, тренер будет считать и
          подсказывать голосом.
        </p>

        <button
          type="button"
          onClick={() => void start()}
          className="mt-7 flex items-center gap-2 rounded-full bg-neutral-900 px-8 py-4 text-sm font-extrabold text-white transition hover:opacity-85"
        >
          <Play className="size-4" fill="currentColor" aria-hidden />
          Начать упражнение
        </button>

        {status === "error" && error && (
          <p className="mt-4 max-w-md text-sm font-semibold text-amber-700">
            {error}
          </p>
        )}
      </section>

      <div
        hidden={!overlayOpen}
        className="fixed inset-0 z-100 bg-black"
        role="dialog"
        aria-label={`Тренировка: ${exercise.title}`}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className="size-full -scale-x-100 object-cover"
        />
        <canvas
          ref={canvasRef}
          hidden={status !== "live"}
          className="pointer-events-none absolute inset-0 size-full -scale-x-100 object-cover"
        />

        <div className="absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent p-4 sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white/60">
              {exercise.category}
            </p>
            <p className="text-lg font-extrabold text-white sm:text-2xl">
              {exercise.title}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !voiceOn;
                setVoiceOn(next);
                voiceOnRef.current = next;
                if (!next) window.speechSynthesis?.cancel();
              }}
              aria-pressed={voiceOn}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold transition ${
                voiceOn ? "bg-white text-neutral-900" : "bg-white/20 text-white"
              }`}
            >
              {voiceOn ? (
                <Volume2 className="size-4" aria-hidden />
              ) : (
                <VolumeX className="size-4" aria-hidden />
              )}
              Голос
            </button>
            <button
              type="button"
              onClick={() => {
                const next = !aiOn;
                setAiOn(next);
                aiOnRef.current = next;
              }}
              aria-pressed={aiOn}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold transition ${
                aiOn ? "bg-white text-neutral-900" : "bg-white/20 text-white"
              }`}
            >
              {aiOn ? (
                <Bot className="size-4" aria-hidden />
              ) : (
                <BotOff className="size-4" aria-hidden />
              )}
              Подсказки ИИ
            </button>
            <button
              type="button"
              onClick={stop}
              className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-red-600"
            >
              <X className="size-4" strokeWidth={3} aria-hidden />
              Завершить
            </button>
          </div>
        </div>

        {completed && (
          <div className="absolute left-1/2 top-24 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg">
            <BadgeCheck className="size-5" aria-hidden />
            Упражнение засчитано
          </div>
        )}

        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="rounded-full bg-white/15 px-6 py-3 text-sm font-semibold text-white">
              Запускаю камеру и распознавание позы…
            </p>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-black/80 to-transparent p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div
            className="rounded-[24px] px-6 py-4"
            style={{ backgroundColor: style.bg, color: style.ink }}
          >
            <p className="text-3xl font-extrabold leading-none sm:text-4xl">
              {progressLabel}
            </p>
            <p className="mt-1 text-xs font-bold opacity-70">
              {progressCaption}
            </p>
          </div>

          <div className="min-w-0 flex-1 sm:max-w-xl">
            <p className="rounded-[20px] bg-white/90 px-5 py-3 text-sm font-bold text-neutral-900">
              {hint}
            </p>
            {plan.mode === "hand" && (
              <p
                className={`mt-2 rounded-[20px] px-5 py-2 text-xs font-bold ${
                  handsVisible
                    ? "bg-emerald-500/80 text-white"
                    : "bg-amber-500/80 text-white"
                }`}
              >
                {handsVisible
                  ? "Кисть распознана"
                  : "Кисть не видна: поднеси руку ближе к камере, на светлый фон"}
              </p>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
