import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_BANNER = os.path.join(ROOT, "banner-tapete-atrapamugre.webp")
SRC_LOGO = os.path.join(ROOT, "Logo-areas-cuadradas.webp")
SRC_FAVICON = os.path.join(ROOT, "favicon-source.png")

OUT = os.path.join(ROOT, "dist", "tapetes-atrapamugres-pvc", "assets", "img")
HERO_OUT = os.path.join(OUT, "hero")
os.makedirs(HERO_OUT, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

banner = Image.open(SRC_BANNER).convert("RGB")
print("banner original size:", banner.size)

# Imagen original es retrato (1024x1536): se usa como imagen de flyer contenida junto
# al bloque de texto del hero, no como fondo panorámico a todo lo ancho. Por eso los
# anchos de srcset no superan el ancho nativo (evita reescalar hacia arriba = borroso).
widths = [400, 700, 1024]
for w in widths:
    ratio = w / banner.width
    h = round(banner.height * ratio)
    resized = banner.resize((w, h), Image.LANCZOS)
    out_path = os.path.join(HERO_OUT, f"banner-tapete-atrapamugre-{w}w.webp")
    resized.save(out_path, "WEBP", quality=72, method=6)
    print("saved", out_path, os.path.getsize(out_path) / 1024, "KB")

# OG image 1200x630 (crop center)
target_ratio = 1200 / 630
bw, bh = banner.size
current_ratio = bw / bh
if current_ratio > target_ratio:
    new_w = int(bh * target_ratio)
    left = (bw - new_w) // 2
    box = (left, 0, left + new_w, bh)
else:
    new_h = int(bw / target_ratio)
    top = (bh - new_h) // 2
    box = (0, top, bw, top + new_h)
og = banner.crop(box).resize((1200, 630), Image.LANCZOS)
og_path = os.path.join(OUT, "og-image.jpg")
og.save(og_path, "JPEG", quality=82, optimize=True)
print("saved", og_path, os.path.getsize(og_path) / 1024, "KB")

# Gallery slot 1: crop the mats-only bottom portion of the banner (product close-up)
gw, gh = banner.size
crop_top = int(gh * 0.42)
gallery_crop = banner.crop((0, crop_top, gw, gh))
os.makedirs(os.path.join(OUT, "productos"), exist_ok=True)
gallery_path = os.path.join(OUT, "productos", "galeria-1.webp")
gallery_crop.resize((900, round(900 * gallery_crop.height / gallery_crop.width)), Image.LANCZOS).save(
    gallery_path, "WEBP", quality=75, method=6
)
print("saved", gallery_path, os.path.getsize(gallery_path) / 1024, "KB")

# Recorte del tapete principal (parte superior) para la tarjeta "tráfico pesado"
mat_crop = banner.crop((0, 0, gw, crop_top))
mat_path = os.path.join(OUT, "productos", "trafico-pesado-1.webp")
mat_crop.resize((900, round(900 * mat_crop.height / mat_crop.width)), Image.LANCZOS).save(
    mat_path, "WEBP", quality=78, method=6
)
print("saved", mat_path, os.path.getsize(mat_path) / 1024, "KB")

# Logo copy + favicons
logo = Image.open(SRC_LOGO).convert("RGBA")
logo_out = os.path.join(OUT, "logo-areas-cuadradas.webp")
logo.save(logo_out, "WEBP", quality=90)
print("saved", logo_out)

def square_favicon(img, size):
    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
    bg.paste(img, (0, 0), img if img.mode == "RGBA" else None)
    bg = bg.convert("RGB")
    return bg.resize((size, size), Image.LANCZOS)

favicon_src = Image.open(SRC_FAVICON).convert("RGBA")
fav32 = square_favicon(favicon_src, 32)
fav32.save(os.path.join(OUT, "favicon-32.png"), "PNG")
fav16 = square_favicon(favicon_src, 16)
fav16.save(os.path.join(OUT, "favicon-16.png"), "PNG")
apple = square_favicon(favicon_src, 180)
apple.save(os.path.join(OUT, "apple-touch-icon.png"), "PNG")
SITE_ROOT = os.path.dirname(os.path.dirname(OUT))
fav32.save(os.path.join(SITE_ROOT, "favicon.ico"), sizes=[(16, 16), (32, 32)])
print("favicons saved")

print("DONE")
