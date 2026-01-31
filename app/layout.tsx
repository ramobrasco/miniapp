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

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_ORIGIN ?? "https://miniapp-dun-one.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Should I? – Ask the crowd";
  const description = "A fun, lightweight decision app. Ask “Should I…?” and get a quick Yes / No / Wait / Depends from the crowd.";

  const fcMiniapp = {
    version: "next" as const,
    imageUrl: `${BASE_URL}/og-image`,
    button: {
      title: "Ask the crowd",
      action: {
        type: "launch_miniapp" as const,
        name: "Should I?",
        url: BASE_URL,
        splashImageUrl: `${BASE_URL}/og-image`,
        splashBackgroundColor: "#ffffff",
      },
    },
  };

  return {
    title,
    description,
    manifest: "/manifest.webmanifest",
    openGraph: {
      title,
      description,
      url: BASE_URL,
      siteName: "Should I?",
      images: [
        {
          url: `${BASE_URL}/og-image`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${BASE_URL}/og-image`],
    },
    other: {
      "fc:miniapp": JSON.stringify(fcMiniapp),
    },
  };
}

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
