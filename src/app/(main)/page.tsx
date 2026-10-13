import ExerciseBoard from "@/components/ExerciseBoard";

export default function Home() {
  return (
    <div className="px-1 py-2 sm:px-2 sm:py-4">
      {/* видимого заголовка нет, но у страницы должен быть h1 для скринридеров */}
      <h1 className="sr-only">Упражнения для детей с ДЦП</h1>
      <ExerciseBoard />
    </div>
  );
}
