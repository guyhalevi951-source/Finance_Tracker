"""Border-seeded background removal for app logo. Run from repo root."""
from __future__ import annotations

import os
import sys
from collections import deque

from PIL import Image

WHITE_THRESHOLD = 240
FEATHER_RANGE = (235, 255)  # near-white edge pixels get partial alpha


def is_background_white(r: int, g: int, b: int) -> bool:
    return r >= WHITE_THRESHOLD and g >= WHITE_THRESHOLD and b >= WHITE_THRESHOLD


def flood_fill_background(rgba: Image.Image) -> Image.Image:
    w, h = rgba.size
    pixels = rgba.load()
    visited = [[False] * w for _ in range(h)]
    queue: deque[tuple[int, int]] = deque()

    def try_seed(x: int, y: int) -> None:
        if visited[y][x]:
            return
        r, g, b, a = pixels[x, y]
        if is_background_white(r, g, b):
            visited[y][x] = True
            queue.append((x, y))

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)

    while queue:
        x, y = queue.popleft()
        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                nr, ng, nb, _ = pixels[nx, ny]
                if is_background_white(nr, ng, nb):
                    visited[ny][nx] = True
                    queue.append((nx, ny))

    return rgba


def feather_edges(rgba: Image.Image) -> Image.Image:
    w, h = rgba.size
    pixels = rgba.load()
    low, high = FEATHER_RANGE
    to_feather: list[tuple[int, int, int, int, int, int]] = []

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            has_transparent_neighbor = False
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h and pixels[nx, ny][3] == 0:
                    has_transparent_neighbor = True
                    break
            if not has_transparent_neighbor:
                continue
            whiteness = min(r, g, b)
            if whiteness >= low:
                t = (whiteness - low) / max(high - low, 1)
                new_alpha = int(255 * (1 - t))
                to_feather.append((x, y, r, g, b, min(a, new_alpha)))

    for x, y, r, g, b, new_a in to_feather:
        pixels[x, y] = (r, g, b, new_a)

    return rgba


def trim_transparent(rgba: Image.Image) -> Image.Image:
    bbox = rgba.getbbox()
    if bbox is None:
        return rgba
    return rgba.crop(bbox)


def count_interior_holes(rgba: Image.Image) -> int:
    w, h = rgba.size
    alpha = rgba.getchannel("A")
    px = alpha.load()
    transparent = [[px[x, y] == 0 for x in range(w)] for y in range(h)]
    seen = [[False] * w for _ in range(h)]
    queue: deque[tuple[int, int]] = deque()

    def seed(x: int, y: int) -> None:
        if transparent[y][x] and not seen[y][x]:
            seen[y][x] = True
            queue.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and transparent[ny][nx] and not seen[ny][nx]:
                seen[ny][nx] = True
                queue.append((nx, ny))

    total_transparent = sum(sum(row) for row in transparent)
    border_connected = sum(sum(1 for x in range(w) if seen[y][x]) for y in range(h))
    return total_transparent - border_connected


def assert_bbox_flush(rgba: Image.Image) -> None:
    w, h = rgba.size
    alpha = rgba.getchannel("A")
    px = alpha.load()

    def row_has_opaque(y: int) -> bool:
        return any(px[x, y] > 0 for x in range(w))

    def col_has_opaque(x: int) -> bool:
        return any(px[x, y] > 0 for y in range(h))

    if not row_has_opaque(0):
        raise AssertionError("Trimmed image: top edge has no opaque pixels")
    if not row_has_opaque(h - 1):
        raise AssertionError("Trimmed image: bottom edge has no opaque pixels")
    if not col_has_opaque(0):
        raise AssertionError("Trimmed image: left edge has no opaque pixels")
    if not col_has_opaque(w - 1):
        raise AssertionError("Trimmed image: right edge has no opaque pixels")


def process_logo(src_path: str, out_paths: list[str]) -> Image.Image:
    img = Image.open(src_path).convert("RGBA")
    img = flood_fill_background(img)
    img = feather_edges(img)
    img = trim_transparent(img)

    holes = count_interior_holes(img)
    if holes != 0:
        raise AssertionError(f"Interior transparent holes: {holes} (expected 0)")
    assert_bbox_flush(img)

    for out in out_paths:
        os.makedirs(os.path.dirname(out), exist_ok=True)
        img.save(out, "PNG")

    return img


if __name__ == "__main__":
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("LOGO_SRC", "")
    if not src:
        raise SystemExit("Usage: process-app-logo.py <source.jpg>")

    out1 = os.path.join(base, "src", "assets", "branding", "app-logo.png")
    out2 = os.path.join(base, "public", "app-logo.png")
    result = process_logo(src, [out1, out2])
    print(f"OK size={result.size} holes=0 bbox_flush=True")
    print(f"Wrote {out1}")
    print(f"Wrote {out2}")
