import json
import re
import sys
import time
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class Source:
    name: str
    url: str


SOURCES: list[Source] = [
    # 🇧🇩 Primary
    Source("iptv-org/iptv (BD)", "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/bd.m3u"),
    Source("Rakib49/Rakibiptv (aynaott)", "https://raw.githubusercontent.com/Rakib49/Rakibiptv/main/aynaott.m3u"),
    Source("Rakib49/Rakibiptv (sports)", "https://raw.githubusercontent.com/Rakib49/Rakibiptv/main/Sports-138.m3u"),

    # 🌍 Big globals / community lists (best-effort entrypoints)
    Source("Free-TV/IPTV", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8"),
    Source("Free-TV/IPTV (all)", "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u"),
    Source("fanmingming/live (ipv6)", "https://raw.githubusercontent.com/fanmingming/live/main/tv/m3u/ipv6.m3u"),
    Source("joevess/IPTV", "https://raw.githubusercontent.com/joevess/IPTV/master/iptv.m3u8"),
    Source("vbskycn/iptv", "https://raw.githubusercontent.com/vbskycn/iptv/master/tv/iptv.m3u"),
    Source("wcb1969/iptv", "https://raw.githubusercontent.com/wcb1969/iptv/master/iptv.m3u"),
    Source("YueChan/Live", "https://raw.githubusercontent.com/YueChan/Live/main/TVBox/TVBox.txt"),
    Source("HerbertHe/iptv-sources", "https://raw.githubusercontent.com/HerbertHe/iptv-sources/master/iptv.m3u"),
    Source("ssili126/tv", "https://raw.githubusercontent.com/ssili126/tv/main/TV.txt"),
    Source("ngo5/IPTV", "https://raw.githubusercontent.com/ngo5/IPTV/master/iptv.m3u"),
    Source("Meroser/IPTV", "https://raw.githubusercontent.com/Meroser/IPTV/master/iptv.m3u"),
    Source("wuddz-devs/wuddz-iptv", "https://raw.githubusercontent.com/wuddz-devs/wuddz-iptv/main/playlist.m3u"),
    # Note: Guovin/iptv-api and others have moving output paths; we'll add more once confirmed.
]


URL_RE = re.compile(r"https?://[^\s\"']+", re.IGNORECASE)


def http_get_text(url: str, timeout_s: int = 20) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "IPTV-Fallback-Expander/1.0"})
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        return resp.read().decode("utf-8", errors="replace")


def normalize_name(name: str) -> str:
    n = name.lower()
    # common noise tokens
    n = re.sub(r"\b(uhd|fhd|hd|sd|4k|1080p|720p|480p|60fps)\b", "", n)
    n = re.sub(r"[\(\)\[\]\{\}\-_\|,:;.!?\"'`~@#$%^&*+=/\\]", " ", n)
    n = re.sub(r"\s+", " ", n).strip()
    return n


def iter_m3u_pairs(text: str) -> Iterable[tuple[str, str]]:
    """
    Best-effort M3U parser:
    - reads EXTINF display name if present
    - next non-empty line becomes URL
    """
    lines = [ln.strip() for ln in text.splitlines()]
    pending_name = None
    for ln in lines:
        if not ln:
            continue
        if ln.startswith("#EXTINF"):
            # name after comma
            parts = ln.split(",", 1)
            pending_name = parts[1].strip() if len(parts) == 2 else None
            continue
        if ln.startswith("#"):
            continue
        # url line
        if URL_RE.match(ln):
            yield (pending_name or ln, ln)
        pending_name = None


def iter_txt_urls(text: str) -> Iterable[tuple[str, str]]:
    """
    Extract URL-ish tokens from text lists.
    Uses the line itself as a name hint if it has a prefix like 'Name,http://...'.
    """
    for raw in text.splitlines():
        ln = raw.strip()
        if not ln or ln.startswith("#"):
            continue
        m = URL_RE.search(ln)
        if not m:
            continue
        url = m.group(0).strip()
        # name hint: before first comma / whitespace
        name_hint = ln.split(",", 1)[0].strip()
        if name_hint == url:
            name_hint = url
        yield (name_hint, url)


def collect_candidates() -> list[dict]:
    candidates: list[dict] = []
    for src in SOURCES:
        try:
            text = http_get_text(src.url)
        except Exception as exc:  # noqa: BLE001
            print(f"[WARN] Failed to fetch {src.name}: {exc}")
            continue

        pairs = []
        if ".m3u" in src.url:
            pairs = list(iter_m3u_pairs(text))
        else:
            pairs = list(iter_txt_urls(text))

        for nm, url in pairs:
            candidates.append(
                {
                    "name_hint": nm,
                    "norm": normalize_name(nm),
                    "url": url.strip(),
                    "source": src.name,
                }
            )

        print(f"[OK] {src.name}: {len(pairs)} entries")
        time.sleep(0.2)  # be gentle

    return candidates


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    channels_path = root / "channels.json"
    playlist_path = root / "playlist.m3u"

    channels = json.loads(channels_path.read_text(encoding="utf-8"))
    by_norm: dict[str, list[dict]] = {}
    for c in channels:
        by_norm.setdefault(normalize_name(c["name"]), []).append(c)

    candidates = collect_candidates()
    # index candidates by normalized name for fast matching
    cand_by_norm: dict[str, list[dict]] = {}
    for cand in candidates:
        cand_by_norm.setdefault(cand["norm"], []).append(cand)

    added_fallbacks = 0
    matched_channels = 0

    for norm_name, items in by_norm.items():
        if norm_name in cand_by_norm:
            matched_channels += len(items)
            urls = [c["url"] for c in cand_by_norm[norm_name]]
            for ch in items:
                existing = set([ch["url"], *ch.get("fallback_urls", [])])
                for u in urls:
                    if u not in existing:
                        ch.setdefault("fallback_urls", []).append(u)
                        existing.add(u)
                        added_fallbacks += 1

    # Add new channels (only a small curated set) if we saw them but don't already have them.
    # NOTE: to avoid breaking the UI with thousands of entries, we only add a limited number.
    existing_norms = set(by_norm.keys())
    new_channels: list[dict] = []
    for cand_norm, cand_list in cand_by_norm.items():
        if cand_norm in existing_norms:
            continue
        # heuristics: add only if name hint looks like a channel, and URL is http(s)
        best = cand_list[0]
        name = best["name_hint"]
        if len(name) < 3 or len(name) > 60:
            continue
        if not best["url"].startswith("http"):
            continue
        # keep additions constrained
        if len(new_channels) >= 40:
            break
        new_channels.append(
            {
                "id": re.sub(r"[^a-z0-9]+", "-", cand_norm)[:48].strip("-") or f"ch-{len(new_channels)+1}",
                "name": name,
                "logo": "",
                "url": best["url"],
                "fallback_urls": [],
                "category": "News" if "news" in cand_norm else "Sports" if "sport" in cand_norm else "Entertainment",
                "country": "",
                "language": "",
                "status": "live",
                "source_credit": best["source"],
            }
        )

    if new_channels:
        channels.extend(new_channels)

    # Final dedupe fallback_urls (per channel)
    for ch in channels:
        seen = set([ch["url"]])
        deduped = []
        for u in ch.get("fallback_urls", []):
            if u in seen:
                continue
            deduped.append(u)
            seen.add(u)
        ch["fallback_urls"] = deduped

    channels_path.write_text(json.dumps(channels, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # Regenerate playlist.m3u from updated channels.json
    lines = ['#EXTM3U x-tvg-url="https://MdMarufHossen71.github.io/IPTV/epg.xml"']
    for ch in channels:
        gid = ch["id"]
        name = ch["name"]
        logo = ch.get("logo", "")
        cat = ch.get("category", "Other")
        country = ch.get("country", "")
        lang = ch.get("language", "")
        lines.append(
            f'#EXTINF:-1 tvg-id="{gid}" tvg-name="{name}" tvg-logo="{logo}" tvg-country="{country}" tvg-language="{lang}" group-title="{cat}",{name}'
        )
        lines.append(ch["url"])
    playlist_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print("---")
    print(f"Channels: {len(channels)}")
    print(f"Matched existing channels: {matched_channels}")
    print(f"Added fallback URLs: {added_fallbacks}")
    print(f"Added NEW channels: {len(new_channels)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

