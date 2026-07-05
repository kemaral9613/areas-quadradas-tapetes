import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Coloca aquí la foto de referencia con las 20 muestras de color antes de ejecutar este script.
SRC = os.path.join(ROOT, "reference-colores.jpg")
OUT_DIR = os.path.join(ROOT, "build", ".scratch", "colores")
os.makedirs(OUT_DIR, exist_ok=True)

img = Image.open(SRC).convert("RGB")
W, H = img.size
print("size", W, H)

GRID_X0 = 434
GRID_X1 = W
COLS = 4
ROWS = 5
col_w = (GRID_X1 - GRID_X0) / COLS
row_h = H / ROWS

labels = [
    ["negro", "gris-oscuro", "gris", "blanco"],
    ["marron", "beige", "oro", "amarillo"],
    ["naranja", "rosado", "fucsia", "rojo"],
    ["vinotinto", "morado", "vinotinto-oscuro", "verde"],
    ["verde-luminoso", "verde-manzana", "celeste", "azul"],
]

INSET_X = 18
TOP_PAD = 18
CROP_H = 108

contact_thumbs = []
for r in range(ROWS):
    row_top = r * row_h
    for c in range(COLS):
        col_left = GRID_X0 + c * col_w
        box = (
            int(col_left + INSET_X),
            int(row_top + TOP_PAD),
            int(col_left + col_w - INSET_X),
            int(row_top + TOP_PAD + CROP_H),
        )
        crop = img.crop(box)
        name = labels[r][c]
        out_path = os.path.join(OUT_DIR, f"{r}-{c}-{name}.png")
        crop.save(out_path)
        contact_thumbs.append((name, crop))
        print("saved", out_path, crop.size)

# contact sheet for visual QA
cell_w, cell_h = 200, 130
sheet = Image.new("RGB", (cell_w * COLS, cell_h * ROWS), "white")
for i, (name, crop) in enumerate(contact_thumbs):
    r, c = divmod(i, COLS)
    thumb = crop.resize((cell_w - 4, cell_h - 4))
    sheet.paste(thumb, (c * cell_w + 2, r * cell_h + 2))
sheet.save(os.path.join(OUT_DIR, "_contact_sheet.png"))
print("DONE")
