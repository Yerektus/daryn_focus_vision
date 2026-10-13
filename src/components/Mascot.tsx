import Image from "next/image";

export const MASCOT_NAME = "Барсик";

/** idle  спокойно ждёт и следит;
 *  help  ребёнок вне кадра или завалился: качается и машет, зовёт;
 *  party упражнение засчитано: прыгает, вокруг конфетти. */
export type MascotMood = "idle" | "help" | "party";

const CONFETTI = [
  { className: "left-[4%] top-[8%] size-2.5 rounded-sm", color: "#2585AE" },
  { className: "right-[6%] top-[4%] size-3 rounded-full", color: "#CF3A80" },
  { className: "right-[0%] top-[38%] size-2.5 rounded-sm", color: "#1E9C6B" },
  { className: "left-[0%] top-[44%] size-2 rounded-full", color: "#A87406" },
  { className: "left-[24%] top-[0%] size-2 rounded-sm", color: "#7B3FD1" },
];

type Props = {
  mood?: MascotMood;
  /** Пока звучит голос, Барсик чуть пружинит в такт */
  talking?: boolean;
  /** Каждое новое значение даёт один радостный прыжок (повторение засчитано) */
  hop?: number;
  className?: string;
};

/** Барсик с картинки: настроение передаём движением (классы barsik-* в
 *  globals.css), при prefers-reduced-motion он стоит спокойно. */
export default function Mascot({
  mood = "idle",
  talking = false,
  hop = 0,
  className = "",
}: Props) {
  return (
    <div className={`relative ${className}`} data-mood={mood} aria-hidden>
      {/* key перезапускает прыжок на каждое новое значение hop */}
      <div
        key={hop}
        className={`size-full ${hop > 0 || mood === "party" ? "barsik-hop" : ""}`}
      >
        <div className={`size-full barsik-mood-${mood}`}>
          <Image
            src="/mascot/barsik.webp"
            alt=""
            width={496}
            height={640}
            className={`size-full object-contain ${talking ? "barsik-talk" : ""}`}
          />
        </div>
      </div>

      {mood === "party" &&
        CONFETTI.map((c, i) => (
          <span
            key={i}
            className={`barsik-confetti absolute ${c.className}`}
            style={{ backgroundColor: c.color, animationDelay: `${i * 0.25}s` }}
          />
        ))}
    </div>
  );
}
