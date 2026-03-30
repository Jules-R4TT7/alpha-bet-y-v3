import type { Metadata, Viewport } from "next";
import SessionProvider from "@/components/SessionProvider";
import PostHogProvider from "@/components/PostHogProvider";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Alpha-bet-y | Competitive Word Bidding Game",
  description:
    "Race to type words, bid on targets, and outsmart your opponents in this fast-paced multiplayer word game.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Alpha-bet-y",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-game-bg text-white antialiased">
        <PostHogProvider>
          <SessionProvider>{children}</SessionProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
