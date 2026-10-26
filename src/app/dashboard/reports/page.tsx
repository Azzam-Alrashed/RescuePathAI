import type { Metadata } from "next";
import { ResponseReports } from "@/components/dashboard/ResponseReports";

export const metadata: Metadata = {
  title: "تقارير الاستجابة – RescuePath AI",
  description: "Response reports: reports handled, response times and outcomes (prototype).",
};

export default function ReportsPage() {
  return <ResponseReports />;
}
