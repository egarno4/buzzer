"""Extract privacy policy HTML from agent transcript JSONL."""
import json
import re
from pathlib import Path

TRANSCRIPT = Path(
    r"C:\Users\Ed's Laptop\.cursor\projects\c-Users-Ed-s-Laptop-OneDrive-Desktop-buzzer\agent-transcripts\7606cbe3-1e72-4b13-8e78-ed163b7fd5d5\7606cbe3-1e72-4b13-8e78-ed163b7fd5d5.jsonl"
)
OUT = Path(__file__).resolve().parent.parent / "public" / "privacy-policy-body.html"

NEEDLE_FILE = "src/pages/Privacy.jsx"
NEEDLE_ROLE = '"role":"user"'


def main() -> None:
    text = TRANSCRIPT.read_text(encoding="utf-8", errors="replace")
    chosen = None
    for line in text.splitlines():
        if NEEDLE_FILE in line and NEEDLE_ROLE in line:
            chosen = line
            break
    if not chosen:
        raise SystemExit(f"No line found containing both {NEEDLE_FILE!r} and {NEEDLE_ROLE!r}")

    obj = json.loads(chosen)
    parts = obj.get("message", {}).get("content") or []
    if not parts or not isinstance(parts[0], dict):
        raise SystemExit("message.content[0] missing")
    body = parts[0].get("text")
    if not isinstance(body, str):
        raise SystemExit("message.content[0].text is not a string")

    body = body.strip()
    m = re.match(r"^\s*<user_query>\s*(.*)\s*</user_query>\s*$", body, re.DOTALL | re.IGNORECASE)
    if m:
        body = m.group(1).strip()

    idx = body.find("<style>")
    if idx == -1:
        raise SystemExit("No <style> found in extracted text")
    body = body[idx:].strip()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(body, encoding="utf-8")
    print(OUT.resolve())
    print("character_count:", len(body))


if __name__ == "__main__":
    main()
