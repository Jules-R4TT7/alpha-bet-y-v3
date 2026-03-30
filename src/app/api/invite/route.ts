import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";

// GET /api/invite — generate invite link data for current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      name: true,
      rating: true,
      gamesPlayed: true,
      gamesWon: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Generate a referral code from user id (base36 last 8 chars)
  const referralCode = user.id.slice(-8);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  trackEvent(session.user.id, "invite_sent", {
    referralCode,
    rating: user.rating,
    gamesPlayed: user.gamesPlayed,
  });

  return NextResponse.json({
    referralCode,
    inviteUrl: `${appUrl}/invite/${referralCode}`,
    shareText: `Join me on Alpha-bet-y! I've played ${user.gamesPlayed} games with a rating of ${user.rating}. Think you can beat me? 🎮`,
    user: {
      username: user.username ?? user.name,
      rating: user.rating,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
    },
  });
}
