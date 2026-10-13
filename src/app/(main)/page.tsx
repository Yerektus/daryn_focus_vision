import { Cloud, Sparkles, Star } from "lucide-react";
import ExerciseBoard from "@/components/ExerciseBoard";
import Mascot from "@/components/Mascot";

export default function Home() {
  return (
    <div className="px-1 py-2 sm:px-2 sm:py-4">
      <section className="relative flex items-end justify-between gap-4 overflow-hidden rounded-[36px] bg-[#FFE7A8] px-6 pt-8 shadow-[0_6px_0_#F3CF72] sm:px-10 sm:pt-10">
        {/* декор: медленно парит, при reduced-motion стоит */}
        <Cloud
          className="kid-float absolute left-[46%] top-6 hidden size-12 text-white sm:block"
          fill="currentColor"
          strokeWidth={0}
          aria-hidden
        />
        <Star
          className="kid-float absolute right-[30%] top-[18%] hidden size-6 sm:block text-[#FF9F45] [animation-delay:1.5s]"
          fill="currentColor"
          strokeWidth={0}
          aria-hidden
        />
        <Sparkles
          className="kid-float absolute bottom-6 left-[58%] hidden size-7 text-grape/60 [animation-delay:3s] sm:block"
          strokeWidth={2.5}
          aria-hidden
        />

        <h1 className="heading-kid relative max-w-3xl pb-8 text-4xl leading-[1.05] sm:pb-10 sm:text-5xl lg:text-6xl">
          Упражнения для детей с ДЦП
        </h1>
        <Mascot className="relative hidden h-40 w-32 shrink-0 sm:block lg:h-52 lg:w-40" />
      </section>

      <div className="mt-8 sm:mt-10">
        <ExerciseBoard />
      </div>
    </div>
  );
}
