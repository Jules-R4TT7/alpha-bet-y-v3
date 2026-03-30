import type { Metadata } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameId: string }>;
}): Promise<Metadata> {
  const { gameId } = await params;

  return {
    title: "Game Result",
    description:
      "Check out this Alpha-bet-y game result! Can you beat the score?",
    openGraph: {
      title: "Alpha-bet-y Game Result",
      description:
        "Check out this Alpha-bet-y game result! Can you beat the score?",
      url: `${appUrl}/share/${gameId}`,
      siteName: "Alpha-bet-y",
      type: "website",
      images: [
        {
          url: `/api/og?title=Game+Result&subtitle=Can+you+beat+the+score%3F`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Alpha-bet-y Game Result",
      description:
        "Check out this Alpha-bet-y game result! Can you beat the score?",
      images: [
        `/api/og?title=Game+Result&subtitle=Can+you+beat+the+score%3F`,
      ],
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
