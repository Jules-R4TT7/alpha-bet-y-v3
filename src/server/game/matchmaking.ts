import { redis } from "@/lib/redis";

const CASUAL_QUEUE = "matchmaking:casual";
const RANKED_QUEUE = "matchmaking:ranked";
const QUEUE_ENTRY_TTL = 120; // 2 minutes max wait

export interface QueueEntry {
  userId: string;
  socketId: string;
  username: string;
  rating: number;
  joinedAt: number;
}

export async function joinCasualQueue(entry: QueueEntry): Promise<void> {
  // Store entry with TTL to auto-expire stale entries
  const key = `${CASUAL_QUEUE}:${entry.userId}`;
  await redis.set(key, JSON.stringify(entry), "EX", QUEUE_ENTRY_TTL);
  await redis.sadd(CASUAL_QUEUE, entry.userId);
}

export async function joinRankedQueue(entry: QueueEntry): Promise<void> {
  const key = `${RANKED_QUEUE}:${entry.userId}`;
  await redis.set(key, JSON.stringify(entry), "EX", QUEUE_ENTRY_TTL);
  // Use sorted set with rating as score for rating-based matching
  await redis.zadd(RANKED_QUEUE, entry.rating, entry.userId);
}

export async function leaveQueue(userId: string): Promise<void> {
  await redis.srem(CASUAL_QUEUE, userId);
  await redis.zrem(RANKED_QUEUE, userId);
  await redis.del(`${CASUAL_QUEUE}:${userId}`);
  await redis.del(`${RANKED_QUEUE}:${userId}`);
}

export async function findCasualMatch(
  userId: string
): Promise<QueueEntry | null> {
  const members = await redis.smembers(CASUAL_QUEUE);
  for (const memberId of members) {
    if (memberId === userId) continue;
    const data = await redis.get(`${CASUAL_QUEUE}:${memberId}`);
    if (!data) {
      // Stale entry, clean up
      await redis.srem(CASUAL_QUEUE, memberId);
      continue;
    }
    const entry = JSON.parse(data) as QueueEntry;
    // Remove matched player from queue
    await redis.srem(CASUAL_QUEUE, memberId);
    await redis.del(`${CASUAL_QUEUE}:${memberId}`);
    return entry;
  }
  return null;
}

export async function findRankedMatch(
  userId: string,
  rating: number,
  ratingRange: number = 200
): Promise<QueueEntry | null> {
  // Find players within rating range
  const minRating = rating - ratingRange;
  const maxRating = rating + ratingRange;
  const members = await redis.zrangebyscore(
    RANKED_QUEUE,
    minRating,
    maxRating
  );

  for (const memberId of members) {
    if (memberId === userId) continue;
    const data = await redis.get(`${RANKED_QUEUE}:${memberId}`);
    if (!data) {
      await redis.zrem(RANKED_QUEUE, memberId);
      continue;
    }
    const entry = JSON.parse(data) as QueueEntry;
    // Remove matched player from queue
    await redis.zrem(RANKED_QUEUE, memberId);
    await redis.del(`${RANKED_QUEUE}:${memberId}`);
    return entry;
  }
  return null;
}
