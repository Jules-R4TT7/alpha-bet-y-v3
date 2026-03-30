import type { Metadata } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Daily Challenge",
  description:
    "Same letter for everyone. One attempt per day. Compete for the top spot on today's Alpha-bet-y daily challenge.",
  openGraph: {
    title: "Alpha-bet-y Daily Challenge",
    description:
      "Same letter, one shot. How many words can you type in 60 seconds?",
    url: `${appUrl}/daily-challenge`,
    images: [
      {
        url: `/api/og?title=Daily+Challenge&subtitle=Same+letter+for+everyone.+One+attempt+per+day.`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alpha-bet-y Daily Challenge",
    description:
      "Same letter, one shot. How many words can you type in 60 seconds?",
  },
};

export default function DailyChallengeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
