import { createRateLimiter } from "./rateLimitEngine.js";

/**
 * Rate-limit adapter: the shared engine (rateLimitEngine.js, byte-identical to
 * DOCS/shared/rate-limit/engine/node) with this project's slug and one bucket. The engine
 * handles X-Forwarded-For, central config from the control sheet, event mode, the kill
 * switch (503) and fail-open. Without Upstash credentials it is a no-op (local dev).
 */
export const limiter = createRateLimiter({
  // Slug = full project folder name (matches the central control-sheet rows).
  project: "ail-ay2627-s1-minxie-trustkaki",
  buckets: {
    // One fictional check-in message through the agent team (triage, specialists, briefing).
    chat: Number(process.env.RATE_LIMIT_CHAT_MAX || 5),
  },
  redisUrl: process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_URL,
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_TOKEN,
  defaultWindow: Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 432000),
});
