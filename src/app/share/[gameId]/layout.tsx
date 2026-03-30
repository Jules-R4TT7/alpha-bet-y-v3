import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameId: string }>;
}): Promise<Metadata> {
  const { gameId } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    title: "Alpha-bet-y Game Result",
    description: "Check out this Alpha-bet-y game result! Can you beat the score?",
    openGraph: {
      title: "Alpha-bet-y Game Result",
      description: "Check out this Alpha-bet-y game result! Can you beat the score?",
      url: `${appUrl}/share/${gameId}`,
      siteName: "Alpha-bet-y",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Alpha-bet-y Game Result",
      description: "Check out this Alpha-bet-y game result! Can you beat the score?",
    },
  };
}

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
