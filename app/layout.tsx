import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import OfflineNotice from "./offline-notice";
import { site } from "@/lib/site-data";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.tagline,
  applicationName: site.name,
  keywords: [
    "Pairview",
    "커플 기록",
    "음식점 리뷰",
    "비공개 로그",
    "pair log",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: site.url,
    title: site.name,
    description: site.tagline,
  },
  twitter: {
    card: "summary",
    title: site.name,
    description: site.tagline,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <OfflineNotice />
        <Analytics />
      </body>
    </html>
  );
}
