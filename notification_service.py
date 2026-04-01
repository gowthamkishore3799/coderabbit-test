"""Simple notification service supporting email and SMS channels."""

import time
from typing import Optional


class NotificationService:
    def __init__(self):
        self._subscribers: dict[str, list[str]] = {}
        self._history: list[dict] = []

    def subscribe(self, user_id: str, channel: str) -> None:
        self._subscribers.setdefault(channel, [])
        if user_id not in self._subscribers[channel]:
            self._subscribers[channel].append(user_id)

    def unsubscribe(self, user_id: str, channel: str) -> bool:
        channel_subs = self._subscribers.get(channel, [])
        if user_id in channel_subs:
            channel_subs.remove(user_id)
            return True
        return False

    def send(self, channel: str, message: str, sender: Optional[str] = "system") -> dict:
        recipients = self._subscribers.get(channel, [])
        record = {
            "channel": channel,
            "message": message,
            "sender": sender,
            "recipients": list(recipients),
            "timestamp": time.time(),
            "delivered": len(recipients),
        }
        self._history.append(record)
        return record

    def broadcast(self, message: str) -> list[dict]:
        return [self.send(ch, message) for ch in self._subscribers]

    def history(self, channel: Optional[str] = None) -> list[dict]:
        if channel:
            return [r for r in self._history if r["channel"] == channel]
        return list(self._history)

    def stats(self) -> dict:
        total = sum(r["delivered"] for r in self._history)
        return {
            "channels": list(self._subscribers.keys()),
            "total_notifications_sent": len(self._history),
            "total_deliveries": total,
        }
