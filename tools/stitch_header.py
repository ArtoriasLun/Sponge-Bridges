from PIL import Image, ImageFilter
import numpy as np

import os
SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'images')
h1 = Image.open(f'{SRC}/H1.jpg').convert('RGB')
h2 = Image.open(f'{SRC}/H2.jpg').convert('RGB')
h3 = Image.open(f'{SRC}/H3.jpg').convert('RGB')

# Lower CROP_H = scene shifts further up / tighter crop from the bottom.
# Source images (H1/H2/H3) are 2706px tall. y0 is already 0 (top of each
# source image) for all three panels, so the only way to shift the visible
# scene further up is to shorten CROP_H (crops more off the bottom).
CROP_H = 2706
W = 1536
panels = [
    (h1, 0),
    (h2, 0),
    (h3, 0),
]

crops = [im.crop((0, y0, W, y0 + CROP_H)) for im, y0 in panels]

OVERLAP = 220
n = len(crops)
total_w = W * n - OVERLAP * (n - 1)
canvas = Image.new('RGB', (total_w, CROP_H), (10, 8, 14))

def feather_mask(w, h, fade_left, fade_right):
    grad = np.full((h, w), 255, dtype=np.uint8)
    if fade_left > 0:
        ramp = np.linspace(0, 255, fade_left).astype(np.uint8)
        grad[:, :fade_left] = np.minimum(grad[:, :fade_left], ramp[np.newaxis, :])
    if fade_right > 0:
        ramp = np.linspace(255, 0, fade_right).astype(np.uint8)
        grad[:, -fade_right:] = np.minimum(grad[:, -fade_right:], ramp[np.newaxis, :])
    return Image.fromarray(grad, mode='L')

x = 0
for i, panel in enumerate(crops):
    fade_left = OVERLAP if i > 0 else 0
    fade_right = OVERLAP if i < n - 1 else 0
    if fade_left == 0 and fade_right == 0:
        canvas.paste(panel, (x, 0))
    else:
        mask = feather_mask(panel.width, panel.height, fade_left, fade_right)
        canvas.paste(panel, (x, 0), mask)
    x += panel.width - OVERLAP

draw_layer = Image.new('RGB', canvas.size, (14, 10, 20))
fog_mask = Image.new('L', canvas.size, 0)
fm = np.array(fog_mask)
x = W - OVERLAP
for i in range(n - 1):
    center = x + OVERLAP // 2
    half = OVERLAP // 2 + 40
    xs = np.arange(canvas.width)
    dist = np.abs(xs - center)
    strength = np.clip(1 - dist / half, 0, 1) * 120
    fm = np.maximum(fm, strength.astype(np.uint8)[np.newaxis, :].repeat(CROP_H, axis=0))
    x += W - OVERLAP
fog_mask = Image.fromarray(fm, mode='L').filter(ImageFilter.GaussianBlur(60))
canvas = Image.composite(draw_layer, canvas, fog_mask)

target_w = 3800
target_h = round(canvas.height * target_w / canvas.width)
canvas = canvas.resize((target_w, target_h), Image.LANCZOS)

canvas.save(f'{SRC}/header.jpg', quality=88)
print('saved', canvas.size, '->', f'{SRC}/header.jpg')
