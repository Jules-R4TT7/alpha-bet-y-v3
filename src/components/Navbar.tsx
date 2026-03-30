"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="text-lg font-bold sm:text-xl">
          Alpha-bet-y
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 sm:flex">
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

        {/* Mobile: notification bell + hamburger */}
        <div className="flex items-center gap-3 sm:hidden">
          {session?.user && <NotificationBell />}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="touch-target flex items-center justify-center"
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/10 px-4 pb-4 pt-2 sm:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/daily-challenge"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              Daily Challenge
            </Link>
            <Link
              href="/leaderboards"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              Leaderboards
            </Link>
            {session?.user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="rounded-lg px-3 py-3 text-left text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 rounded-lg bg-game-accent px-3 py-3 text-center font-semibold transition hover:brightness-110"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
