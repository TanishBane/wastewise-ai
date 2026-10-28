"""
WasteWise AI - In-Memory Sliding Window Rate Limiter
Defends heavy ML forecasting and ingestion endpoints against resource exhaustion attacks.
Returns standard HTTP 429 Too Many Requests with Retry-After header upon violation.
"""

import os
import time
from collections import defaultdict
from threading import Lock
from typing import Dict, List
from fastapi import HTTPException, Request, status


class SlidingWindowRateLimiter:
    """
    Thread-safe in-memory sliding-window rate limiter per client key (IP or tenant ID).
    """

    def __init__(self, requests_per_minute: int = 120):
        self.rpm = requests_per_minute
        self.window_seconds = 60.0
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self.lock = Lock()
        self.enabled = os.getenv("WASTEWISE_RATE_LIMIT_ENABLED", "true").lower() in ("true", "1", "yes")

    def check(self, key: str) -> None:
        if not self.enabled:
            return

        now = time.time()
        window_start = now - self.window_seconds

        with self.lock:
            timestamps = self.requests[key]
            # Prune timestamps older than window
            valid_timestamps = [t for t in timestamps if t > window_start]
            if len(valid_timestamps) >= self.rpm:
                oldest = valid_timestamps[0]
                retry_after = max(1, int(self.window_seconds - (now - oldest)))
                self.requests[key] = valid_timestamps
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Maximum {self.rpm} requests per minute allowed.",
                    headers={"Retry-After": str(retry_after)},
                )

            valid_timestamps.append(now)
            self.requests[key] = valid_timestamps


# Global singleton instance
rate_limiter = SlidingWindowRateLimiter(
    requests_per_minute=int(os.getenv("WASTEWISE_RATE_LIMIT_PER_MINUTE", "120"))
)


def rate_limit_dependency(request: Request) -> None:
    """FastAPI dependency to rate limit by client IP or tenant header."""
    client_ip = request.client.host if request.client else "unknown"
    org_id = request.headers.get("X-Organization-Id") or "global"
    key = f"{org_id}:{client_ip}"
    rate_limiter.check(key)
