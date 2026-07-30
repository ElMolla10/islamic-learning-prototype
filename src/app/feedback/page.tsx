import type { Metadata } from "next";
import { FeedbackForm } from "@/components/FeedbackForm";

export const metadata: Metadata = {
  title: "Alpha feedback",
  robots: { index: false, follow: false },
};

export default function FeedbackPage() {
  return <FeedbackForm />;
}
