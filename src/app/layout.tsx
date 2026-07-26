import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

export const metadata: Metadata = {
  title: { default: "Manārāt — Internal prototype", template: "%s · Manārāt" },
  description: "A private, local Islamic learning prototype.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body><LanguageProvider><AppHeader/>{children}<AppFooter/></LanguageProvider></body></html>;
}
