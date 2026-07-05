import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SRC_DIR = os.path.join(ROOT, "build", ".scratch", "colores")
OUT_DIR = os.path.join(ROOT, "dist", "tapetes-atrapamugres-pvc", "assets", "img", "colores")
os.makedirs(OUT_DIR, exist_ok=True)

TARGET_W, TARGET_H = 240, 150

for fname in sorted(os.listdir(SRC_DIR)):
    if not fname.endswith(".png") or fname.startswith("_"):
        continue
    parts = fname[:-4].split("-", 2)
    slug = fname[:-4].split("-", 2)[-1] if False else None
    # filename format: {row}-{col}-{slug}.png -> slug may contain dashes
    base = fname[:-4]
    row_col, _, slug = base.partition("-")
    _, _, slug = base.split("-", 2)
    img = Image.open(os.path.join(SRC_DIR, fname)).convert("RGB")
    # center-crop to target aspect then resize
    tw_ratio = TARGET_W / TARGET_H
    w, h = img.size
    cur_ratio = w / h
    if cur_ratio > tw_ratio:
        new_w = int(h * tw_ratio)
        left = (w - new_w) // 2
        box = (left, 0, left + new_w, h)
    else:
        new_h = int(w / tw_ratio)
        top = (h - new_h) // 2
        box = (0, top, w, top + new_h)
    cropped = img.crop(box).resize((TARGET_W, TARGET_H), Image.LANCZOS)
    out_path = os.path.join(OUT_DIR, f"{slug}.webp")
    cropped.save(out_path, "WEBP", quality=80, method=6)
    print("saved", out_path, os.path.getsize(out_path) / 1024, "KB")

print("DONE")
