interface RateLimitState {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const fallbackCheckoutAttempts = new Map<string, RateLimitState>();
const fallbackCheckoutWindowMs = 10 * 60 * 1000;
const fallbackCheckoutMaxAttempts = 8;

export function consumeFallbackCheckoutAttempt(
  key: string,
  now = Date.now()
): RateLimitResult {
  pruneExpiredAttempts(now);

  const currentState = fallbackCheckoutAttempts.get(key);

  if (!currentState || currentState.resetAt <= now) {
    fallbackCheckoutAttempts.set(key, {
      count: 1,
      resetAt: now + fallbackCheckoutWindowMs,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (currentState.count >= fallbackCheckoutMaxAttempts) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((currentState.resetAt - now) / 1000),
    };
  }

  currentState.count += 1;

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

function pruneExpiredAttempts(now: number): void {
  if (fallbackCheckoutAttempts.size < 1000) {
    return;
  }

  for (const [key, state] of fallbackCheckoutAttempts.entries()) {
    if (state.resetAt <= now) {
      fallbackCheckoutAttempts.delete(key);
    }
  }
}
