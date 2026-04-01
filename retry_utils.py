"""Retry utility with exponential backoff and jitter."""

import time
import random
import functools
from typing import Callable, Tuple, Type


def retry(
    max_attempts: int = 3,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
    base_delay: float = 0.5,
    max_delay: float = 10.0,
    jitter: bool = True,
):
    """Decorator that retries a function on specified exceptions."""
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            delay = base_delay
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    if attempt == max_attempts:
                        raise
                    sleep_time = delay + (random.uniform(0, delay) if jitter else 0)
                    sleep_time = min(sleep_time, max_delay)
                    time.sleep(sleep_time)
                    delay = min(delay * 2, max_delay)
        return wrapper
    return decorator


class RetryBudget:
    """Tracks retry attempts across calls to avoid thundering herd."""

    def __init__(self, budget: int = 100):
        self._budget = budget
        self._used = 0

    def consume(self, cost: int = 1) -> bool:
        if self._used + cost > self._budget:
            return False
        self._used += cost
        return True

    def remaining(self) -> int:
        return self._budget - self._used

    def reset(self):
        self._used = 0
