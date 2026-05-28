"""
Lightweight HTTP API client with retry logic and response caching.
"""

import time
import hashlib
import json
from dataclasses import dataclass, field
from typing import Any, Optional
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode


@dataclass
class APIResponse:
    status_code: int
    body: Any
    headers: dict
    elapsed_ms: float
    from_cache: bool = False

    @property
    def ok(self) -> bool:
        return 200 <= self.status_code < 300

    def json(self) -> Any:
        if isinstance(self.body, str):
            return json.loads(self.body)
        return self.body


@dataclass
class RetryConfig:
    max_retries: int = 3
    backoff_factor: float = 0.5
    retry_on_status: list[int] = field(default_factory=lambda: [429, 500, 502, 503, 504])


class APIClient:
    """Simple API client with retry and in-memory caching."""

    def __init__(
        self,
        base_url: str,
        default_headers: Optional[dict] = None,
        retry_config: Optional[RetryConfig] = None,
        cache_ttl_seconds: int = 300,
    ):
        self.base_url = base_url.rstrip("/")
        self.default_headers = default_headers or {"Content-Type": "application/json"}
        self.retry_config = retry_config or RetryConfig()
        self.cache_ttl_seconds = cache_ttl_seconds
        self._cache: dict[str, tuple[float, APIResponse]] = {}

    def _cache_key(self, method: str, url: str, params: Optional[dict]) -> str:
        raw = f"{method}:{url}:{json.dumps(params or {}, sort_keys=True)}"
        return hashlib.sha256(raw.encode()).hexdigest()

    def _get_cached(self, key: str) -> Optional[APIResponse]:
        if key in self._cache:
            timestamp, response = self._cache[key]
            if time.time() - timestamp < self.cache_ttl_seconds:
                response.from_cache = True
                return response
            del self._cache[key]
        return None

    def _set_cached(self, key: str, response: APIResponse) -> None:
        self._cache[key] = (time.time(), response)

    def _make_request(
        self,
        method: str,
        path: str,
        params: Optional[dict] = None,
        body: Optional[dict] = None,
        headers: Optional[dict] = None,
    ) -> APIResponse:
        url = f"{self.base_url}/{path.lstrip('/')}"
        if params:
            url = f"{url}?{urlencode(params)}"

        merged_headers = {**self.default_headers, **(headers or {})}

        data = None
        if body is not None:
            data = json.dumps(body).encode("utf-8")

        request = Request(url, data=data, headers=merged_headers, method=method)

        last_error = None
        for attempt in range(self.retry_config.max_retries + 1):
            start = time.monotonic()
            try:
                with urlopen(request) as resp:
                    elapsed = (time.monotonic() - start) * 1000
                    response_body = resp.read().decode("utf-8")
                    try:
                        response_body = json.loads(response_body)
                    except (json.JSONDecodeError, ValueError):
                        pass

                    return APIResponse(
                        status_code=resp.status,
                        body=response_body,
                        headers=dict(resp.headers),
                        elapsed_ms=round(elapsed, 2),
                    )

            except HTTPError as e:
                elapsed = (time.monotonic() - start) * 1000
                if e.code not in self.retry_config.retry_on_status:
                    return APIResponse(
                        status_code=e.code,
                        body=e.read().decode("utf-8"),
                        headers=dict(e.headers),
                        elapsed_ms=round(elapsed, 2),
                    )
                last_error = e

            except URLError as e:
                last_error = e

            if attempt < self.retry_config.max_retries:
                sleep_time = self.retry_config.backoff_factor * (2 ** attempt)
                time.sleep(sleep_time)

        raise ConnectionError(
            f"Failed after {self.retry_config.max_retries + 1} attempts: {last_error}"
        )

    def get(
        self,
        path: str,
        params: Optional[dict] = None,
        headers: Optional[dict] = None,
        use_cache: bool = True,
    ) -> APIResponse:
        if use_cache:
            cache_key = self._cache_key("GET", path, params)
            cached = self._get_cached(cache_key)
            if cached:
                return cached

        response = self._make_request("GET", path, params=params, headers=headers)

        if use_cache and response.ok:
            self._set_cached(cache_key, response)

        return response

    def post(
        self,
        path: str,
        body: Optional[dict] = None,
        headers: Optional[dict] = None,
    ) -> APIResponse:
        return self._make_request("POST", path, body=body, headers=headers)

    def put(
        self,
        path: str,
        body: Optional[dict] = None,
        headers: Optional[dict] = None,
    ) -> APIResponse:
        return self._make_request("PUT", path, body=body, headers=headers)

    def delete(
        self,
        path: str,
        headers: Optional[dict] = None,
    ) -> APIResponse:
        return self._make_request("DELETE", path, headers=headers)

    def clear_cache(self) -> int:
        count = len(self._cache)
        self._cache.clear()
        return count


def create_github_client(token: str) -> APIClient:
    """Create a pre-configured client for the GitHub API."""
    return APIClient(
        base_url="https://api.github.com",
        default_headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json",
        },
        retry_config=RetryConfig(max_retries=2, backoff_factor=1.0),
        cache_ttl_seconds=60,
    )
