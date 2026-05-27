import json
import ssl
import sys
import time
import urllib.request
from pathlib import Path


def check_url(url: str, timeout: int = 8) -> tuple[bool, str]:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (IPTV Stream Checker)"
        }
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout, context=ssl._create_unverified_context()) as resp:
            code = getattr(resp, "status", 200)
            if 200 <= code < 400:
                return True, f"HTTP {code}"
            return False, f"HTTP {code}"
    except Exception as exc:  # noqa: BLE001
        return False, str(exc)


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    channels_file = root / "channels.json"
    if not channels_file.exists():
        print("channels.json not found.")
        return 1

    channels = json.loads(channels_file.read_text(encoding="utf-8"))
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else len(channels)
    limit = max(1, min(limit, len(channels)))
    sample = channels[:limit]

    ok_count = 0
    failed = []
    start = time.time()
    print(f"Checking {len(sample)} channel streams...\n")

    for idx, channel in enumerate(sample, start=1):
        ok, reason = check_url(channel["url"])
        status = "OK" if ok else "FAIL"
        print(f"[{idx:02d}] {status:<4} {channel['name']} -> {reason}")
        if ok:
            ok_count += 1
        else:
            failed.append(channel["id"])

    elapsed = time.time() - start
    print("\n---")
    print(f"Checked: {len(sample)}")
    print(f"Reachable: {ok_count}")
    print(f"Failed: {len(failed)}")
    print(f"Elapsed: {elapsed:.1f}s")
    if failed:
        print(f"Failed IDs: {', '.join(failed)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
