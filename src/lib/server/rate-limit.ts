/**
 * Fixed-window in-memory rate limiter. Adequate for a single instance and for
 * demo deployments; replace with a shared store (e.g. Redis) when running
 * multiple instances.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  if (b.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { allowed: true, remaining: limit - b.count, retryAfterSeconds: 0 };
}

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}

/** Stricter limits for operations that create public content. */
export const LIMITS: Record<string, { limit: number; windowMs: number }> = {
  submitProblem: { limit: 5, windowMs: 60 * 60 * 1000 },
  proposeQuestion: { limit: 10, windowMs: 60 * 60 * 1000 },
  submitContribution: { limit: 20, windowMs: 60 * 60 * 1000 },
  report: { limit: 10, windowMs: 60 * 60 * 1000 },
  createProfile: { limit: 5, windowMs: 60 * 60 * 1000 },
  default: { limit: 120, windowMs: 60 * 1000 },
};
