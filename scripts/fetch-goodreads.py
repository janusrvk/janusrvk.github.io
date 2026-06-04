#!/usr/bin/env python3
"""Haal Goodreads-shelves op en schrijf goodreads.json. Wordt door GitHub Actions
en optioneel lokaal uitgevoerd (`python3 scripts/fetch-goodreads.py`)."""
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

USER_ID = "161530834"
SHELVES = ["currently-reading", "read"]
UA = "Mozilla/5.0 (compatible; janusrvk.com goodreads-sync)"

OUT_PATHS = [
    Path(__file__).resolve().parent.parent / "goodreads.json",
    Path(__file__).resolve().parent.parent / "public" / "goodreads.json",
]


def cdata(s: str) -> str:
    s = s.strip()
    if s.startswith("<![CDATA[") and s.endswith("]]>"):
        s = s[len("<![CDATA["):-len("]]>")]
    return unescape(s.strip())


def field(item_xml: str, tag: str) -> str:
    m = re.search(rf"<{re.escape(tag)}>(.*?)</{re.escape(tag)}>", item_xml, re.S)
    return cdata(m.group(1)) if m else ""


def to_iso_date(rss_date: str) -> str:
    """Try several RSS date formats; return YYYY-MM-DD or empty string."""
    if not rss_date:
        return ""
    for fmt in ("%a, %d %b %Y %H:%M:%S %z", "%a, %d %b %Y %H:%M:%S"):
        try:
            return datetime.strptime(rss_date, fmt).date().isoformat()
        except ValueError:
            continue
    return ""


def parse_shelf(xml: str) -> list[dict]:
    items = re.findall(r"<item>(.*?)</item>", xml, re.S)
    out = []
    for it in items:
        title = field(it, "title")
        link = field(it, "link").split("?")[0]
        author = field(it, "author_name")
        image = field(it, "book_large_image_url") or field(it, "book_medium_image_url") or field(it, "book_image_url")
        # Normaliseer naar grotere cover
        if image:
            image = re.sub(r"\._\w+\d+_\.", ".", image)
        read_at = to_iso_date(field(it, "user_read_at"))
        pub_date = to_iso_date(field(it, "pubDate"))
        out.append({
            "title": title,
            "author": author,
            "link": link,
            "image": image,
            "dateRead": read_at,
            "dateAdded": pub_date,
        })
    return out


def fetch_shelf(shelf: str) -> str:
    url = f"https://www.goodreads.com/review/list_rss/{USER_ID}?shelf={shelf}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def main() -> int:
    data = {
        "updated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "shelves": {},
    }
    for shelf in SHELVES:
        try:
            xml = fetch_shelf(shelf)
            data["shelves"][shelf] = parse_shelf(xml)
            print(f"{shelf}: {len(data['shelves'][shelf])} items", file=sys.stderr)
        except Exception as e:
            print(f"FAILED {shelf}: {e}", file=sys.stderr)
            return 1

    for out in OUT_PATHS:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
        print(f"wrote {out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
