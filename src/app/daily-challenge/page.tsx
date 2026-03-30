"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { scoreWord, getMinWordLength } from "@/game/constants";

interface Challenge {
  id: string;
  date: string;
  letter: string;
  target: number;
  participants: number;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  wordsPlayed: number;
}

export default function DailyChallengePage() {
  const { data: session } = useSession();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [word, setWord] = useState("");
  const [words, setWords] = useState<{ word: string; points: number }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [playing, setPlaying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/daily-challenge")
      .then((r) => r.json())
      .then(setChallenge);
    fetch("/api/daily-challenge/leaderboard")
      .then((r) => r.json())
      .then((data) => setLeaderboard(data.entries ?? []));
  }, []);

  useEffect(() => {
    if (!playing || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [playing, timeLeft]);

  useEffect(() => {
    if (playing && timeLeft === 0) {
      handleSubmitChallenge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, playing]);

  const handleSubmitChallenge = useCallback(async () => {
    if (!challenge || submitted) return;
    setPlaying(false);
    setSubmitted(true);

    if (session?.user) {
      await fetch("/api/daily-challenge/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          score,
          wordsPlayed: words.length,
        }),
      });

      // Refresh leaderboard
      const lb = await fetch("/api/daily-challenge/leaderboard");
      const data = await lb.json();
      setLeaderboard(data.entries ?? []);
    }
  }, [challenge, submitted, session, score, words.length]);

  function handleAddWord() {
    if (!challenge) return;
    setError("");

    const cleaned = word.trim().toLowerCase();
    if (!cleaned) return;

    // Validate: starts with challenge letter
    if (cleaned[0] !== challenge.letter.toLowerCase()) {
      setError(`Word must start with ${challenge.letter}`);
      return;
    }

    // Validate: minimum length
    const minLen = getMinWordLength(challenge.letter);
    if (cleaned.length < minLen) {
      setError(`Word must be at least ${minLen} characters`);
      return;
    }

    // Validate: only letters
    if (!/^[a-z]+$/.test(cleaned)) {
      setError("Only letters allowed");
      return;
    }

    // Validate: no duplicates
    if (words.some((w) => w.word === cleaned)) {
      setError("Already used this word");
      return;
    }

    const points = scoreWord(cleaned);
    setWords((prev) => [...prev, { word: cleaned, points }]);
    setScore((s) => s + points);
    setWord("");
  }

  function startPlaying() {
    setPlaying(true);
    setTimeLeft(60);
    setWords([]);
    setScore(0);
    setSubmitted(false);
  }

  function handleShareResult() {
    const text = `I scored ${score} pts (${words.length} words) on today's Alpha-bet-y Daily Challenge! Letter: ${challenge?.letter} Can you beat me?`;
    if (navigator.share) {
      navigator.share({ text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text + "\n" + window.location.href);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:p-8">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Daily Challenge</h1>
        <p className="mb-6 text-sm text-gray-400 sm:mb-8 sm:text-base">
          Same letter for everyone. One attempt per day. Compete for the top spot.
        </p>

        {!challenge ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-6">
            {/* Challenge info */}
            <div className="rounded-xl bg-game-card p-4 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 sm:text-sm">{challenge.date}</p>
                  <p className="mt-1 text-base sm:text-lg">
                    Today&apos;s letter:{" "}
                    <span className="text-3xl font-bold text-game-gold sm:text-4xl">
                      {challenge.letter}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                    Target: {challenge.target} words | {challenge.participants}{" "}
                    players today
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {playing && (
                    <div>
                      <p className="text-3xl font-bold text-game-accent sm:text-4xl">
                        {timeLeft}s
                      </p>
                      <p className="text-xs text-gray-400 sm:text-sm">remaining</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Game area */}
            {!playing && !submitted && (
              <button
                onClick={startPlaying}
                className="w-full rounded-lg bg-game-accent py-4 text-lg font-semibold transition hover:brightness-110"
              >
                Start Challenge (60 seconds)
              </button>
            )}

            {playing && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex gap-2">
                  <input
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
                    placeholder={`Word starting with ${challenge.letter}...`}
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-base focus:border-game-accent focus:outline-none sm:px-4 sm:text-lg"
                    autoFocus
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="done"
                  />
                  <button
                    onClick={handleAddWord}
                    className="shrink-0 rounded-lg bg-game-accent px-4 py-3 font-semibold transition hover:brightness-110 sm:px-6"
                  >
                    Add
                  </button>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex items-center justify-between rounded-lg bg-game-card px-3 py-3 sm:p-4">
                  <span className="text-sm text-gray-400 sm:text-base">
                    {words.length} words played
                  </span>
                  <span className="text-xl font-bold text-game-gold sm:text-2xl">
                    {score} pts
                  </span>
                </div>

                {words.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {words.map((w) => (
                      <span
                        key={w.word}
                        className="rounded-full bg-white/10 px-2.5 py-1 text-xs sm:px-3 sm:text-sm"
                      >
                        {w.word}{" "}
                        <span className="text-game-gold">+{w.points}</span>
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleSubmitChallenge}
                  className="w-full rounded-lg border border-white/20 py-3 text-sm font-semibold transition hover:bg-white/10"
                >
                  Finish Early
                </button>
              </div>
            )}

            {submitted && (
              <div className="space-y-4">
                <div className="rounded-xl bg-game-card p-5 text-center sm:p-6">
                  <p className="text-sm text-gray-400">Your score</p>
                  <p className="text-4xl font-bold text-game-gold sm:text-5xl">{score}</p>
                  <p className="mt-2 text-sm text-gray-300 sm:text-base">
                    {words.length} words in 60 seconds
                  </p>
                  <button
                    onClick={handleShareResult}
                    className="mt-4 w-full rounded-lg bg-game-accent px-6 py-3 font-semibold transition hover:brightness-110 sm:w-auto"
                  >
                    Share Result
                  </button>
                </div>
              </div>
            )}

            {/* Leaderboard */}
            <div>
              <h2 className="mb-3 text-lg font-bold sm:mb-4 sm:text-xl">Today&apos;s Leaderboard</h2>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No entries yet. Be the first!
                </p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.rank}
                      className="flex items-center justify-between rounded-lg bg-game-card px-3 py-2.5 sm:px-4 sm:py-3"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span
                          className={`text-base font-bold sm:text-lg ${
                            entry.rank <= 3 ? "text-game-gold" : "text-gray-400"
                          }`}
                        >
                          #{entry.rank}
                        </span>
                        <span className="truncate text-sm sm:text-base">{entry.username}</span>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-sm font-bold sm:text-base">{entry.score} pts</span>
                        <span className="ml-1.5 text-xs text-gray-400 sm:ml-2 sm:text-sm">
                          ({entry.wordsPlayed} words)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
