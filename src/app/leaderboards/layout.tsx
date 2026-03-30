import type { Metadata } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Leaderboards",
  description:
    "See the top-rated Alpha-bet-y players, longest win streaks, and compare scores with friends.",
  openGraph: {
    title: "Alpha-bet-y Leaderboards",
    description:
      "Top ratings, longest streaks, and friends rankings. See where you stand.",
    url: `${appUrl}/leaderboards`,
    images: [
      {
        url: `/api/og?title=Leaderboards&subtitle=Top+ratings+and+longest+win+streaks`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alpha-bet-y Leaderboards",
    description:
      "Top ratings, longest streaks, and friends rankings. See where you stand.",
  },
};

export default function LeaderboardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
