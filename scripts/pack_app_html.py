#!/usr/bin/env python3
"""Copy a standalone app single-file build to outputs/ with a Chinese filename."""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAMES = {
    "incentive": ("index.incentive.html", "即时激励.html"),
    "medal": ("index.medal.html", "勋章.html"),
    "forum": ("index.forum.html", "论坛.html"),
    "mailbox": ("index.mailbox.html", "信箱.html"),
    "care": ("index.care.html", "员工关怀.html"),
}


def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1] not in NAMES:
        raise SystemExit("usage: pack_app_html.py incentive|medal|forum|mailbox|care")
    app = sys.argv[1]
    src_name, dest_name = NAMES[app]
    src = ROOT / f"dist-app-{app}" / src_name
    if not src.is_file():
        raise SystemExit(f"missing {src}")
    dest_dir = ROOT / "outputs"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / dest_name
    shutil.copyfile(src, dest)
    print(dest, "bytes", dest.stat().st_size)


if __name__ == "__main__":
    main()
