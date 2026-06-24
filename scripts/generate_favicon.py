"""Generate favicon assets from logo_v2.png diamond icon."""
from PIL import Image
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO = os.path.join(REPO, "assets", "images", "logo_v2.png")

img = Image.open(LOGO).convert("RGBA")
w, h = img.size
crop = img.crop((0, 0, int(w * 0.22), h))

pixels = crop.load()
for y in range(crop.height):
    for x in range(crop.width):
        r, g, b, a = pixels[x, y]
        if r > 235 and g > 235 and b > 235:
            pixels[x, y] = (255, 255, 255, 0)

bbox = crop.getbbox()
if not bbox:
    raise SystemExit("Could not isolate logo diamond from logo_v2.png")
crop = crop.crop(bbox)

cw, ch = crop.size
side = max(cw, ch)
square = Image.new("RGBA", (side, side), (255, 255, 255, 0))
square.paste(crop, ((side - cw) // 2, (side - ch) // 2), crop)

sizes = {
    "favicon-16x16.png": 16,
    "favicon-32x32.png": 32,
    "apple-touch-icon.png": 180,
}
for name, size in sizes.items():
    square.resize((size, size), Image.LANCZOS).save(
        os.path.join(REPO, name), optimize=True
    )

ico_sizes = [(16, 16), (32, 32), (48, 48)]
ico_images = [square.resize(s, Image.LANCZOS) for s in ico_sizes]
ico_images[0].save(
    os.path.join(REPO, "favicon.ico"),
    format="ICO",
    sizes=[(s.width, s.height) for s in ico_images],
    append_images=ico_images[1:],
)
print("Favicon assets written to", REPO)
