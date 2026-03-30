import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// GET /api/friends — list users you follow
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const follows = await prisma.follow.findMany({
    where: { followerId: session.user.id },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          rating: true,
          gamesPlayed: true,
          gamesWon: true,
          streak: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    friends: follows.map((f) => ({
      userId: f.following.id,
      username: f.following.username ?? f.following.name,
      image: f.following.image,
      rating: f.following.rating,
      gamesPlayed: f.following.gamesPlayed,
      gamesWon: f.following.gamesWon,
      streak: f.following.streak,
      followedAt: f.createdAt,
    })),
  });
}

const followSchema = z.object({
  userId: z.string().min(1),
});

// POST /api/friends — follow a user
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = followSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  if (parsed.data.userId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot follow yourself" },
      { status: 400 }
    );
  }

  // Check target user exists
  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Upsert to handle idempotent follows
  const follow = await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: parsed.data.userId,
      },
    },
    create: {
      followerId: session.user.id,
      followingId: parsed.data.userId,
    },
    update: {},
  });

  // Notify the followed user
  const follower = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, name: true },
  });

  await prisma.notification.create({
    data: {
      userId: parsed.data.userId,
      type: "FRIEND_JOINED",
      title: "New follower!",
      body: `${follower?.username ?? follower?.name ?? "Someone"} started following you.`,
      data: { followerId: session.user.id },
    },
  });

  return NextResponse.json({ followed: true, id: follow.id }, { status: 201 });
}

// DELETE /api/friends — unfollow a user
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = followSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: session.user.id,
      followingId: parsed.data.userId,
    },
  });

  return NextResponse.json({ unfollowed: true });
}
