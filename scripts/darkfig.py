"""Convert a light-background matplotlib figure to the site's dark theme.

Neutral pixels (white background, black text/points, grays) have their
lightness flipped in CIELAB, mapping white -> the card colour and black ->
the ink colour. Coloured pixels keep their hue and chroma and are only
lifted to a minimum lightness so they stay readable on a dark ground.
The two treatments blend smoothly by chroma, so anti-aliased edges stay clean.
With --invert-all, every pixel's lightness is flipped (hue kept), which keeps
sequential colour maps in order; use it for figures with a colour scale.
Usage: python3 darkfig.py in.png out.png [--invert-all]
"""
import sys
import numpy as np
from PIL import Image
from skimage import color

BG = np.array([0x17, 0x18, 0x1c]) / 255.0     # --card
INK = np.array([0xe6, 0xe5, 0xe2]) / 255.0    # slightly softened --ink
L_BG = color.rgb2lab(BG[None, None])[0, 0, 0]
L_INK = color.rgb2lab(INK[None, None])[0, 0, 0]
L_MIN_COLOUR = 62.0                           # floor for coloured marks

src, dst = sys.argv[1], sys.argv[2]
invert_all = "--invert-all" in sys.argv
im = Image.open(src).convert("RGBA")
rgba = np.asarray(im).astype(float) / 255.0
rgb, alpha = rgba[..., :3], rgba[..., 3:]
rgb = rgb * alpha + (1 - alpha)               # flatten any transparency onto white
lab = color.rgb2lab(rgb)
L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
chroma = np.hypot(a, b)

L_neutral = L_BG + (L_INK - L_BG) * (1 - L / 100.0)
neutral = lab.copy(); neutral[..., 0] = L_neutral
neutral_rgb = np.clip(color.lab2rgb(neutral), 0, 1)

if invert_all:
    out = neutral_rgb
else:
    # Coloured marks: mix toward white until lightness reaches the floor.
    # Mixing in RGB keeps the hue (a lightened blue stays blue).
    f = np.clip((L_MIN_COLOUR - L) / np.maximum(100.0 - L, 1e-6), 0, 1)[..., None]
    for _ in range(3):                         # refine the mix so L lands on the floor
        trial = rgb + (1 - rgb) * f
        Lt = color.rgb2lab(trial)[..., 0]
        need = (Lt < L_MIN_COLOUR - 0.5) & (f[..., 0] < 1)
        f[..., 0] = np.where(need, np.clip(f[..., 0] + (L_MIN_COLOUR - Lt) / 100.0, 0, 1), f[..., 0])
    colour_rgb = rgb + (1 - rgb) * f
    t = np.clip((chroma - 8.0) / (32.0 - 8.0), 0, 1)
    w = (t * t * (3 - 2 * t))[..., None]      # smoothstep weight: 0 neutral .. 1 coloured
    out = (1 - w) * neutral_rgb + w * colour_rgb

Image.fromarray((out * 255 + 0.5).astype(np.uint8)).save(dst, optimize=True)
print("wrote", dst)
