#!/usr/bin/env python3
"""Rebuild the pages whenever a source file changes.

    python3 build/watch.py

Watches build/pages/, build/partials/ and build.py itself. Edit a partial or a
page body, save, and the four root HTML files are regenerated — then just
refresh the browser. Stop it with Ctrl-C.
"""
import pathlib
import time

import build as builder

ROOT = pathlib.Path(__file__).resolve().parent
WATCHED = [ROOT / "pages", ROOT / "partials", ROOT / "build.py"]


def snapshot():
    stamps = {}
    for target in WATCHED:
        if target.is_dir():
            for f in target.glob("*.html"):
                stamps[f] = f.stat().st_mtime
        elif target.exists():
            stamps[target] = target.stat().st_mtime
    return stamps


def main():
    print("watching build/pages, build/partials ... (Ctrl-C to stop)")
    builder.build()
    last = snapshot()
    while True:
        time.sleep(0.6)
        now = snapshot()
        if now != last:
            changed = sorted(
                f.name for f in set(now) ^ set(last)
            ) or sorted(f.name for f in now if last.get(f) != now[f])
            print(f"\nchanged: {', '.join(changed)}")
            try:
                builder.build()
            except Exception as err:                      # keep watching on error
                print(f"build failed: {err}")
            last = now


if __name__ == "__main__":
    main()
