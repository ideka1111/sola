import datetime as dt
import os
from typing import Any
from urllib.parse import quote

import requests


class UpstashRateLimiter:
    """Simple hourly fixed-window limiter using Upstash Redis REST."""

    def __init__(self) -> None:
        self.base_url = (os.getenv("UPSTASH_REDIS_REST_URL") or "").rstrip("/")
        self.token = os.getenv("UPSTASH_REDIS_REST_TOKEN") or ""
        enabled_raw = (os.getenv("RATE_LIMIT_ENABLED", "true") or "").strip().lower()
        env_enabled = enabled_raw in {"1", "true", "yes", "on"}
        self.enabled = env_enabled and bool(self.base_url and self.token)

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token}"}

    def _cmd(self, command: str, *args: str | int) -> Any:
        encoded = "/".join(quote(str(a), safe="") for a in args)
        url = f"{self.base_url}/{command.lower()}"
        if encoded:
            url = f"{url}/{encoded}"

        resp = requests.get(url, headers=self._headers(), timeout=4)
        resp.raise_for_status()
        data = resp.json()
        return data.get("result")

    @staticmethod
    def _seconds_until_next_utc_hour() -> int:
        now = dt.datetime.now(dt.timezone.utc)
        next_hour = (now + dt.timedelta(hours=1)).replace(
            minute=0,
            second=0,
            microsecond=0,
        )
        return max(1, int((next_hour - now).total_seconds()))

    @staticmethod
    def _hour_key() -> str:
        return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d-%H")

    def _incr_hourly(self, key: str) -> tuple[int, int]:
        value = int(self._cmd("INCR", key) or 0)
        ttl = self._seconds_until_next_utc_hour()
        if value == 1:
            # Set expiration only once when the key is created.
            self._cmd("EXPIRE", key, ttl)
        return value, ttl

    def check_limits(self, *, session_id: str, global_limit: int, session_limit: int) -> tuple[bool, str, int]:
        """
        Returns (allowed, reason, retry_after_seconds).
        """
        if not self.enabled:
            return True, "disabled", 0

        hour = self._hour_key()
        global_key = f"rl:chat:global:{hour}"
        session_key = f"rl:chat:session:{hour}:{session_id}"

        global_count, global_ttl = self._incr_hourly(global_key)
        if global_count > global_limit:
            return False, "global_hourly_limit_exceeded", global_ttl

        session_count, session_ttl = self._incr_hourly(session_key)
        if session_count > session_limit:
            return False, "session_hourly_limit_exceeded", session_ttl

        return True, "ok", min(global_ttl, session_ttl)
