import type { Metadata } from "next";
import { Balsamiq_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppHeader } from "@/components/AppHeader";

const balsamiqSans = Balsamiq_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-balsamiq",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Should I? – Ask the crowd",
  description: "A fun, lightweight decision app. Ask “Should I…?” and get a quick Yes / No / Wait / Depends from the crowd.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={balsamiqSans.variable}>
      <body className="bg-white text-zinc-900 font-sans">
        <Providers>
          <AppHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
