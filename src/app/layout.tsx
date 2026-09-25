import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Упражнения для детей с ДЦП",
  description:
    "Подборка домашних упражнений для детей с ДЦП: крупная и мелкая моторика, растяжка, баланс, дыхание и речь.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-[#F7F5F2]/85 backdrop-blur">
          <div className="px-4 py-3 sm:px-6">
            <Nav />
          </div>
        </header>

        <div className="w-full px-4 pb-6 pt-24 sm:px-6 sm:pt-26">{children}</div>
      </body>
    </html>
  );
}
