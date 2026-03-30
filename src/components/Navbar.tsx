"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between border-b border-white/10 px-6 py-4">
      <Link href="/" className="text-xl font-bold">
        Alpha-bet-y
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/daily-challenge"
          className="text-sm text-gray-300 hover:text-white"
        >
          Daily
        </Link>
        <Link
          href="/leaderboards"
          className="text-sm text-gray-300 hover:text-white"
        >
          Leaderboards
        </Link>
        {session?.user ? (
          <>
            <NotificationBell />
            <Link
              href="/profile"
              className="text-sm text-gray-300 hover:text-white"
            >
              {session.user.name || session.user.email}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm text-gray-300 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-game-accent px-4 py-2 text-sm font-semibold transition hover:brightness-110"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
