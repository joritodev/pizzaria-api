export class TooManyRequestsError extends Error {
  constructor(
    message = "Muitas requisições. Tente novamente em instantes.",
    readonly retryAfterSeconds: number,
  ) {
    super(message);
    this.name = "TooManyRequestsError";
  }
}

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export type RateLimitConfig = {
  generalLimit?: number;
  authLimit?: number;
  windowMs?: number;
};

export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly generalLimit: number;
  private readonly authLimit: number;
  private readonly windowMs: number;

  constructor(
    config: RateLimitConfig = {},
    private readonly now: () => number = Date.now,
  ) {
    this.generalLimit = config.generalLimit ?? 100;
    this.authLimit = config.authLimit ?? 5;
    this.windowMs = config.windowMs ?? 60_000;
  }

  consume(ip: string, pathname: string): RateLimitDecision {
    const isAuth = pathname === "/auth/login" || pathname === "/auth/register";
    const limit = isAuth ? this.authLimit : this.generalLimit;
    const key = `${ip}:${isAuth ? "auth" : "general"}`;
    const now = this.now();
    const windowStart = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((timestamp) => timestamp > windowStart);

    if (recent.length >= limit) {
      this.hits.set(key, recent);
      const retryAfterSeconds = Math.max(1, Math.ceil((recent[0]! + this.windowMs - now) / 1000));
      return { allowed: false, limit, remaining: 0, retryAfterSeconds };
    }

    recent.push(now);
    this.hits.set(key, recent);
    this.prune(windowStart);

    return { allowed: true, limit, remaining: limit - recent.length, retryAfterSeconds: 0 };
  }

  private prune(windowStart: number): void {
    for (const [key, timestamps] of this.hits) {
      const recent = timestamps.filter((timestamp) => timestamp > windowStart);
      if (recent.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, recent);
      }
    }
  }
}
