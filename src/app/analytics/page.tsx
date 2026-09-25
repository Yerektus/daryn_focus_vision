import type { Metadata } from "next";
import AnalyticsBoard from "@/components/AnalyticsBoard";

export const metadata: Metadata = {
  title: "Аналитика занятий",
};

export default function AnalyticsPage() {
  return <AnalyticsBoard />;
}
