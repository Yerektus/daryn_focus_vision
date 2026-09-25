import ExerciseBoard from "@/components/ExerciseBoard";

export default function Home() {
  return (
    <div className="px-1 py-2 sm:px-2 sm:py-4">
      <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
        Упражнения для детей с ДЦП
      </h1>

      <div className="mt-8 sm:mt-10">
        <ExerciseBoard />
      </div>
    </div>
  );
}
