import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "لوحة العمليات – RescuePath AI",
  description: "Operations dashboard: AI-triaged SOS queue, human review and team dispatch (prototype).",
};

export default function DashboardPage() {
  return <Dashboard />;
}
