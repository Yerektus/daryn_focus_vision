import type { Metadata } from "next";
import { Balsamiq_Sans, Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
});

/** Детский шрифт только для заголовков: основной текст остаётся на Nunito */
const balsamiq = Balsamiq_Sans({
  variable: "--font-balsamiq",
  weight: ["400", "700"],
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Упражнения для детей с ДЦП",
  description:
    "Подборка домашних упражнений для детей с ДЦП: крупная и мелкая моторика, растяжка, баланс, дыхание и речь.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${nunito.variable} ${balsamiq.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
