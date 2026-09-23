#!/usr/bin/env python3
"""Assemble the static AHM pages from partials.

Usage:  python3 build/build.py
Output: index.html, about.html, donate.html, contact.html in the project root.
The generated files are plain static HTML — this script only saves you from
editing the shared navbar/footer in four places.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
P = ROOT / "build" / "partials"
PAGES = ROOT / "build" / "pages"

HEAD = (P / "head.html").read_text()
FOOT = (P / "foot.html").read_text()

PAGE_META = {
    "index": ("Al-Haqqu l-Mubeen Arabic and Islamic Relations | Knowledge, Compassion, Community",
              "AHM promotes the genuine Islamic values of compassion, justice and the common good "
              "through research, education, dialogue and support for orphans, widows and those in need."),
    "about": ("About Us | Al-Haqqu l-Mubeen Arabic and Islamic Relations",
              "Founded by Muslim scholars and intellectuals, AHM channels Islamic philanthropy, "
              "grants and endowments into education, research, dialogue and care across Africa."),
    "donate": ("Donate | Al-Haqqu l-Mubeen Arabic and Islamic Relations",
               "Give once or monthly to support orphans, widows, Islamic education, research and "
               "our Ramadan radio programmes. Waqf, fundraising and grant partnerships welcome."),
    "contact": ("Contact Us | Al-Haqqu l-Mubeen Arabic and Islamic Relations",
                "Reach the AHM team in Osogbo, Osun State, Nigeria — for enquiries, volunteering, "
                "partnerships, school programmes and media."),
}

ACTIVE = ' aria-current="page"'


def include(body: str) -> str:
    def repl(m):
        return (P / f"{m.group(1)}.html").read_text().rstrip("\n")
    return re.sub(r"[ \t]*\{\{INCLUDE:([a-z0-9_-]+)\}\}", repl, body)


def build():
    for slug, (title, desc) in PAGE_META.items():
        body = include((PAGES / f"{slug}.html").read_text())
        head = (HEAD
                .replace("{{TITLE}}", title)
                .replace("{{DESC}}", desc))
        for key in ("HOME", "ABOUT", "DONATE", "CONTACT"):
            token = "{{ACTIVE_%s}}" % key
            is_active = (key == "HOME" and slug == "index") or key.lower() == slug
            head = head.replace(token, ACTIVE if is_active else "")
        (ROOT / f"{slug}.html").write_text(head + body + FOOT)
        print(f"built {slug}.html")


if __name__ == "__main__":
    build()
