"""Generates every app's PWA icons into <app>/public/icons.  Optional: the generated PNGs are committed,
so you only run this if you change a logo or colour.   python3 scripts/pwa/make_icons.py
Games with a logo in GAME_LOGOS use it; the rest get a monogram tile. Drop your own PNGs into
<app>/public/icons (same file names) at any time to replace them."""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'

# folder: (logo file or None, monogram, gradient top, gradient bottom)
APPS = {
    'Dragon-pyre-strike':         ('GAME_LOGOS/DRACO_PYRE_STRIKE/dracopyrestrike_logo.png', None, '#ffffff', '#ffffff'),
    'drakebreaker-site':          ('GAME_LOGOS/DRAKEBREAKER/drakebreaker_logo.png', None, '#000000', '#000000'),
    'ember-wyrm-site':            ('GAME_LOGOS/EMBER_WYRM/ember_wyrm_logo.png', None, '#0f2a14', '#04100a'),
    'dragon-strike-shooter-site': (None, 'DS', '#f97316', '#7f1d1d'),
    'dragon-flight-site':         (None, 'DF', '#7c3aed', '#1e1b4b'),
    '2042':                       (None, '2048', '#f59e0b', '#7c2d12'),
    'soduko':                     (None, '9', '#6366f1', '#0f172a'),
    'tictactoe':                  (None, 'XO', '#ef4444', '#7c2d12'),
}

def hex2rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def gradient(size, top, bottom):
    t, b = hex2rgb(top), hex2rgb(bottom)
    img = Image.new('RGB', (size, size))
    px = img.load()
    for y in range(size):
        k = y / (size - 1)
        row = tuple(int(t[i] + (b[i] - t[i]) * k) for i in range(3))
        for x in range(size): px[x, y] = row
    return img

def art(size, logo, mono, top, bottom, content=0.74):
    """Full-bleed square artwork with the content inside the maskable safe zone."""
    base = gradient(size, top, bottom).convert('RGBA')
    d = ImageDraw.Draw(base)
    if logo:
        im = Image.open(os.path.join(ROOT, logo)).convert('RGBA')
        side = int(size * content)
        im.thumbnail((side, side), Image.LANCZOS)
        base.alpha_composite(im, ((size - im.width) // 2, (size - im.height) // 2))
    else:
        px = int(size * (0.30 if len(mono) > 2 else 0.42))
        font = ImageFont.truetype(FONT, px)
        d.text((size / 2, size / 2 + size * .02), mono, font=font, fill=(255, 247, 237, 255), anchor='mm')
    return base

def rounded(img, radius_ratio=0.22):
    s = img.size[0]
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * radius_ratio), fill=255)
    out = Image.new('RGBA', img.size, (0, 0, 0, 0)); out.paste(img, (0, 0), mask); return out

for app, (logo, mono, top, bottom) in APPS.items():
    out = os.path.join(ROOT, app, 'public', 'icons'); os.makedirs(out, exist_ok=True)
    for s in (192, 512):
        rounded(art(s, logo, mono, top, bottom, 0.84)).save(os.path.join(out, f'icon-{s}.png'), optimize=True)
    art(512, logo, mono, top, bottom, 0.66).convert('RGB').save(os.path.join(out, 'icon-512-maskable.png'), optimize=True)
    art(180, logo, mono, top, bottom, 0.84).convert('RGB').save(os.path.join(out, 'apple-touch-icon.png'), optimize=True)
    print('icons ->', app)
