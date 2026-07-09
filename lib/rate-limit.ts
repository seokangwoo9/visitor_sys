interface RateLimitState {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const checkoutSearchAttempts = new Map<string, RateLimitState>();
const checkoutSearchWindowMs = 10 * 60 * 1000;
const checkoutSearchMaxAttempts = 8;

export function consumeCheckoutSearchAttempt(
  key: string,
  now = Date.now()
): RateLimitResult {
  pruneExpiredAttempts(now);

  const currentState = checkoutSearchAttempts.get(key);

  if (!currentState || currentState.resetAt <= now) {
    checkoutSearchAttempts.set(key, {
      count: 1,
      resetAt: now + checkoutSearchWindowMs,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (currentState.count >= checkoutSearchMaxAttempts) {
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
  if (checkoutSearchAttempts.size < 1000) {
    return;
  }

  for (const [key, state] of checkoutSearchAttempts.entries()) {
    if (state.resetAt <= now) {
      checkoutSearchAttempts.delete(key);
    }
  }
}
