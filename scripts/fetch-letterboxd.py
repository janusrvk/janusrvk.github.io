#!/usr/bin/env python3
"""Vul letterboxd-diary.json aan met nieuwe films uit de Letterboxd RSS-feed.
De feed bevat alleen de laatste 50 films, dus dit script moet regelmatig draaien
(GitHub Actions, dagelijks) zodat er geen gaten in de diary ontstaan.
Lokaal: `python3 scripts/fetch-letterboxd.py`."""
import json
import re
import urllib.request
from html import unescape
from pathlib import Path

USER = "janusrvk"
RSS_URL = f"https://letterboxd.com/{USER}/rss/"
UA = "Mozilla/5.0 (compatible; janusrvk.com letterboxd-sync)"

ROOT = Path(__file__).resolve().parent.parent
OUT_PATHS = [ROOT / "letterboxd-diary.json", ROOT / "public" / "letterboxd-diary.json"]


def field(item_xml: str, tag: str) -> str:
    m = re.search(rf"<{re.escape(tag)}>(.*?)</{re.escape(tag)}>", item_xml, re.S)
    return unescape(m.group(1).strip()) if m else ""


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def main() -> None:
    req = urllib.request.Request(RSS_URL, headers={"User-Agent": UA})
    xml = urllib.request.urlopen(req, timeout=30).read().decode("utf-8")

    diary = json.loads(OUT_PATHS[0].read_text(encoding="utf-8"))
    seen = {(norm(e["title"]), e["date"]) for e in diary}

    added = 0
    for it in re.findall(r"<item>(.*?)</item>", xml, re.S):
        date = field(it, "letterboxd:watchedDate")
        title = field(it, "letterboxd:filmTitle")
        if not date or not title:
            continue  # lijsten e.d., geen diary-entry
        key = (norm(title), date)
        if key in seen:
            continue
        seen.add(key)
        diary.append({
            "date": date,
            "title": title,
            "year": field(it, "letterboxd:filmYear"),
            "uri": field(it, "link"),
            "rating": field(it, "letterboxd:memberRating"),
        })
        added += 1

    diary.sort(key=lambda e: e["date"])
    out = json.dumps(diary, ensure_ascii=False, indent=2) + "\n"
    for p in OUT_PATHS:
        p.write_text(out, encoding="utf-8")
    print(f"{added} nieuwe films toegevoegd ({len(diary)} totaal).")


if __name__ == "__main__":
    main()
