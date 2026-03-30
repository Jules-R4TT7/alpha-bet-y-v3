import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST() {
  const guestId = crypto.randomBytes(4).toString("hex");
  const user = await prisma.user.create({
    data: {
      name: `Guest_${guestId}`,
      username: `guest_${guestId}`,
      isGuest: true,
    },
  });

  return NextResponse.json({ id: user.id, username: user.username });
}
