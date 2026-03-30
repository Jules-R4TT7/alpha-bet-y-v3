import type { Metadata, Viewport } from "next";
import SessionProvider from "@/components/SessionProvider";
import PostHogProvider from "@/components/PostHogProvider";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1a1a2e",
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Alpha-bet-y | Competitive Word Bidding Game",
    template: "%s | Alpha-bet-y",
  },
  description:
    "Race to type words, bid on targets, and outsmart your opponents in this fast-paced multiplayer word game. Play free — no download required.",
  keywords: [
    "word game",
    "multiplayer",
    "bidding game",
    "word puzzle",
    "daily challenge",
    "competitive",
    "online game",
  ],
  authors: [{ name: "Alpha-bet-y" }],
  openGraph: {
    type: "website",
    siteName: "Alpha-bet-y",
    title: "Alpha-bet-y — The Competitive Word Bidding Game",
    description:
      "Bid, bluff, and type fast. Outsmart opponents in real-time word battles. Free to play in your browser.",
    url: appUrl,
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Alpha-bet-y — The Competitive Word Bidding Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alpha-bet-y — The Competitive Word Bidding Game",
    description:
      "Bid, bluff, and type fast. Outsmart opponents in real-time word battles.",
    images: ["/api/og"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Alpha-bet-y",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Alpha-bet-y",
  url: appUrl,
  description:
    "Race to type words, bid on targets, and outsmart your opponents in this fast-paced multiplayer word game.",
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  genre: "Word Game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-game-bg text-white antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <PostHogProvider>
          <SessionProvider>{children}</SessionProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
