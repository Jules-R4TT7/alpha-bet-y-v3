export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-6xl font-bold tracking-tight">
        Alpha-bet-y
      </h1>
      <p className="mb-8 text-xl text-gray-300">
        The competitive word bidding game
      </p>
      <div className="flex gap-4">
        <a
          href="/play"
          className="rounded-lg bg-game-accent px-8 py-4 text-lg font-semibold transition hover:brightness-110"
        >
          Play Now
        </a>
        <a
          href="/login"
          className="rounded-lg border border-white/20 px-8 py-4 text-lg font-semibold transition hover:bg-white/10"
        >
          Sign In
        </a>
      </div>
    </main>
  );
}
