import { describe, expect, test } from "bun:test";

import { SlidingWindowRateLimiter } from "./sliding-window-rate-limiter";

describe("SlidingWindowRateLimiter", () => {
  test("bloqueia o 6º login no mesmo minuto", () => {
    let now = 1_000;
    const limiter = new SlidingWindowRateLimiter({ authLimit: 5, windowMs: 60_000 }, () => now);

    for (let i = 0; i < 5; i += 1) {
      expect(limiter.consume("1.1.1.1", "/auth/login").allowed).toBe(true);
    }

    const blocked = limiter.consume("1.1.1.1", "/auth/login");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);

    now += 60_001;
    expect(limiter.consume("1.1.1.1", "/auth/login").allowed).toBe(true);
  });

  test("login e cardápio têm limites separados", () => {
    const limiter = new SlidingWindowRateLimiter({ authLimit: 1, generalLimit: 2, windowMs: 60_000 });

    expect(limiter.consume("10.0.0.1", "/auth/login").allowed).toBe(true);
    expect(limiter.consume("10.0.0.1", "/auth/login").allowed).toBe(false);
    expect(limiter.consume("10.0.0.1", "/products").allowed).toBe(true);
  });
});
