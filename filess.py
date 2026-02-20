# random_python_tool.py
# Run:
#   python random_python_tool.py --file notes.txt stats
#   python random_python_tool.py --file notes.txt transform --out out.txt
#   python random_python_tool.py --file notes.txt serve --port 8000

from __future__ import annotations
import argparse
import hashlib
import json
import os
import random
import re
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Dict, List, Tuple


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def compute_stats(text: str) -> Dict:
    lines = text.splitlines() or [""]
    # Keep unicode letters/numbers; replace punctuation with spaces.
    words = re.sub(r"[^\w\s]+", " ", text.lower(), flags=re.UNICODE).split()
    freq: Dict[str, int] = {}
    for w in words:
        freq[w] = freq.get(w, 0) + 1

    top10 = sorted(freq.items(), key=lambda kv: kv[1], reverse=True)[:10]
    return {
        "bytes": len(text.encode("utf-8")),
        "lines": len(lines),
        "words": len(words),
        "unique_words": len(freq),
        "sha256": sha256(text),
        "top10": [{"word": w, "count": c} for w, c in top10],
    }


def transform(text: str) -> str:
    # Trim trailing spaces, collapse 3+ blank lines to 2, add line numbers, shuffle occasional "fun" tag.
    cleaned = "\n".join(line.rstrip() for line in text.splitlines())
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)

    out_lines: List[str] = []
    for i, line in enumerate(cleaned.splitlines(), start=1):
        tag = "  # fun" if (line and random.random() < 0.03) else ""
        out_lines.append(f"{i:04d} | {line}{tag}")
    return "\n".join(out_lines) + "\n"


class Handler(BaseHTTPRequestHandler):
    # Very tiny API: /health, /random, /stats?file=...
    def _json(self, status: int, payload: Dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):  # noqa: N802
        if self.path.startswith("/health"):
            return self._json(200, {"ok": True, "ts": time.time()})

        if self.path.startswith("/random"):
            picks = ["coffee", "hiking", "leetcode", "postgres", "kafka", "flink", "lancedb"]
            return self._json(200, {"pick": random.choice(picks), "n": random.random()})

        if self.path.startswith("/stats"):
            # super minimal query parsing
            _, _, q = self.path.partition("?")
            params = dict(p.split("=", 1) for p in q.split("&") if "=" in p)
            file = params.get("file")
            if not file:
                return self._json(400, {"error": "missing ?file=..."})
            p = Path(file).expanduser().resolve()
            if not p.exists() or not p.is_file():
                return self._json(404, {"error": "file not found", "file": str(p)})
            text = p.read_text(encoding="utf-8", errors="replace")
            return self._json(200, {"file": str(p), "stats": compute_stats(text)})

        return self._json(404, {"error": "not found", "hint": "/health, /random, /stats?file=path"})


def serve(port: int):
    httpd = HTTPServer(("127.0.0.1", port), Handler)
    print(f"Serving on http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", "-f", help="input file for stats/transform")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("stats")
    t = sub.add_parser("transform")
    t.add_argument("--out", "-o", required=True)

    s = sub.add_parser("serve")
    s.add_argument("--port", type=int, default=8000)

    args = ap.parse_args()

    if args.cmd in ("stats", "transform"):
        if not args.file:
            raise SystemExit("Error: --file is required for stats/transform")
        p = Path(args.file).expanduser().resolve()
        text = p.read_text(encoding="utf-8", errors="replace")

        if args.cmd == "stats":
            print(json.dumps(compute_stats(text), indent=2))
            return

        out = transform(text)
        out_path = Path(args.out).expanduser().resolve()
        out_path.write_text(out, encoding="utf-8")
