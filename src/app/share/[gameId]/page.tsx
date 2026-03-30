"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface ShareData {
  gameId: string;
  mode: string;
  rounds: number;
  completedAt: string;
  players: {
    username: string;
    score: number;
    result: string | null;
    wordCount: number;
  }[];
  shareText: string;
}

export default function ShareGamePage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const [data, setData] = useState<ShareData | null>(null);
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/share/${gameId}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((d) => d && setData(d));
  }, [gameId]);

  function handleShare() {
    if (!data) return;
    const text = `${data.shareText}\n${window.location.href}`;
    if (navigator.share) {
      navigator.share({ text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6 sm:p-8">
        {notFound ? (
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold sm:text-3xl">Game Not Found</h1>
            <p className="text-gray-400">
              This game doesn&apos;t exist or hasn&apos;t finished yet.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-game-accent px-6 py-3 font-semibold transition hover:brightness-110"
            >
              Play Alpha-bet-y
            </Link>
          </div>
        ) : !data ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Game Result</h1>
              <p className="text-xs text-gray-400 sm:text-sm">
                {data.mode} | {data.rounds} rounds |{" "}
                {new Date(data.completedAt).toLocaleDateString()}
              </p>
            </div>

            {/* Player cards */}
            <div className="grid gap-3 grid-cols-2 sm:gap-4">
              {data.players.map((player) => (
                <div
                  key={player.username}
                  className={`rounded-xl p-4 text-center sm:p-6 ${
                    player.result === "WIN"
                      ? "bg-game-gold/10 border border-game-gold/30"
                      : "bg-game-card"
                  }`}
                >
                  {player.result === "WIN" && (
                    <p className="mb-1 text-xs font-semibold text-game-gold sm:text-sm">
                      Winner
                    </p>
                  )}
                  <p className="truncate text-base font-bold sm:text-xl">{player.username}</p>
                  <p className="mt-1 text-3xl font-bold text-game-gold sm:mt-2 sm:text-4xl">
                    {player.score}
                  </p>
                  <p className="text-xs text-gray-400 sm:text-sm">
                    {player.wordCount} words
                  </p>
                </div>
              ))}
            </div>

            {/* Share + CTA */}
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <button
                onClick={handleShare}
                className="w-full rounded-lg bg-game-accent px-8 py-4 text-lg font-semibold transition hover:brightness-110 sm:w-auto"
              >
                {copied ? "Copied!" : "Share Result"}
              </button>
              <Link
                href="/"
                className="w-full rounded-lg border border-white/20 px-8 py-4 text-center text-lg font-semibold transition hover:bg-white/10 sm:w-auto"
              >
                Play Alpha-bet-y
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
