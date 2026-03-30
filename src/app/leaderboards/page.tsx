"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  image: string | null;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate?: number;
  bestStreak?: number;
  streak?: number;
  isYou?: boolean;
}

type Tab = "global-rating" | "global-streak" | "friends";

export default function LeaderboardsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("global-rating");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let url: string;

    switch (tab) {
      case "global-rating":
        url = "/api/games/leaderboard?type=rating&limit=50";
        break;
      case "global-streak":
        url = "/api/games/leaderboard?type=streak&limit=50";
        break;
      case "friends":
        url = "/api/friends/leaderboard?type=rating";
        break;
    }

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "global-rating", label: "Rating" },
    { key: "global-streak", label: "Streaks" },
    { key: "friends", label: "Friends" },
  ];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="mb-8 text-3xl font-bold">Leaderboards</h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === t.key
                  ? "bg-game-accent"
                  : "border border-white/10 hover:bg-white/10"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {!session?.user && tab === "friends" ? (
          <div className="rounded-xl bg-game-card p-8 text-center">
            <p className="text-gray-400">
              Sign in to see your friends leaderboard.
            </p>
            <a
              href="/login"
              className="mt-4 inline-block rounded-lg bg-game-accent px-6 py-3 font-semibold transition hover:brightness-110"
            >
              Sign In
            </a>
          </div>
        ) : loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : entries.length === 0 ? (
          <div className="rounded-xl bg-game-card p-8 text-center">
            <p className="text-gray-400">
              {tab === "friends"
                ? "Follow other players to see them here!"
                : "No entries yet. Be the first to play!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={`${entry.userId}-${entry.rank}`}
                className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                  entry.isYou ? "bg-game-accent/20 border border-game-accent/40" : "bg-game-card"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 text-lg font-bold ${
                      entry.rank <= 3 ? "text-game-gold" : "text-gray-400"
                    }`}
                  >
                    #{entry.rank}
                  </span>
                  <div>
                    <span className="font-semibold">
                      {entry.username}
                      {entry.isYou && (
                        <span className="ml-2 text-xs text-game-accent">
                          (you)
                        </span>
                      )}
                    </span>
                    <p className="text-xs text-gray-400">
                      {entry.gamesPlayed} games
                      {entry.winRate !== undefined && ` | ${entry.winRate}% win rate`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {(tab === "global-rating" || tab === "friends") && (
                    <p className="text-xl font-bold text-game-gold">
                      {entry.rating}
                    </p>
                  )}
                  {tab === "global-streak" && (
                    <p className="text-xl font-bold text-game-gold">
                      {entry.bestStreak}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {tab === "global-streak" ? "best streak" : "rating"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
