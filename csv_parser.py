"""Lightweight CSV parser with filtering and aggregation helpers."""

import csv
import io
from typing import Any, Callable, Iterator


def read_csv(filepath: str, delimiter: str = ",") -> list[dict]:
    with open(filepath, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter=delimiter))


def write_csv(filepath: str, rows: list[dict], fieldnames: list[str] | None = None) -> None:
    if not rows:
        return
    fields = fieldnames or list(rows[0].keys())
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def filter_rows(rows: list[dict], predicate: Callable[[dict], bool]) -> list[dict]:
    return [r for r in rows if predicate(r)]


def pluck(rows: list[dict], *keys: str) -> list[dict]:
    return [{k: r[k] for k in keys if k in r} for r in rows]


def group_by(rows: list[dict], key: str) -> dict[str, list[dict]]:
    groups: dict[str, list[dict]] = {}
    for row in rows:
        groups.setdefault(row.get(key, ""), []).append(row)
    return groups


def aggregate(rows: list[dict], key: str, numeric_col: str) -> dict[str, float]:
    groups = group_by(rows, key)
    return {
        g: sum(float(r[numeric_col]) for r in rs if r.get(numeric_col))
        for g, rs in groups.items()
    }


def from_string(text: str, delimiter: str = ",") -> list[dict]:
    return list(csv.DictReader(io.StringIO(text), delimiter=delimiter))
