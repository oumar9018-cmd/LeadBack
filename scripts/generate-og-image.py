#!/usr/bin/env python3
"""
Generate public/og-image.png — the Open Graph / Twitter share image.

This is a one-off asset generator, NOT part of `npm run build`. The resulting
PNG is committed to the repo, so you only need to run this if you want to
change the share image:

    pip install Pillow
    python3 scripts/generate-og-image.py

Why generate it instead of exporting from a design tool: it keeps the share
image reproducible and lets us re-render it (with crisp, correctly-kerned
text) whenever the tagline changes.

Required size for social previews: 1200 x 630 px.
"""
import os

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

WIDTH, HEIGHT = 1200, 630
MARGIN = 88

BLUE = (36, 87, 255)
BLUE_DEEP = (18, 48, 143)
NAVY = (11, 18, 32)
WHITE = (255, 255, 255)
MUTED = (207, 220, 255)

FONT_DIR = "/usr/share/fonts/truetype/dejavu"
FONT_BOLD = os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf")
FONT_REGULAR = os.path.join(FONT_DIR, "DejaVuSans.ttf")

OUT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "public",
    "og-image.png",
)


def vertical_gradient(size, top, bottom):
    """Top-to-bottom linear gradient."""
    width, height = size
    gradient = Image.new("RGB", (1, height))
    draw = ImageDraw.Draw(gradient)
    for y in range(height):
        t = y / max(height - 1, 1)
        draw.point(
            (0, y),
            fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)),
        )
    return gradient.resize((width, height))


def add_glow(base, center, radius, color):
    """
    Radial highlight behind the headline.

    Uses a screen blend so the glow only *adds* light: the corners keep the
    base gradient instead of being darkened towards black.
    """
    glow = Image.new("RGB", base.size, (0, 0, 0))
    draw = ImageDraw.Draw(glow)
    cx, cy = center
    draw.ellipse(
        [cx - radius, cy - radius * 0.62, cx + radius, cy + radius * 0.62],
        fill=color,
    )
    glow = glow.filter(ImageFilter.GaussianBlur(140))
    return ImageChops.screen(base, glow)


def text_width(draw, text, font):
    return draw.textbbox((0, 0), text, font=font)[2]


def main():
    bold = ImageFont.truetype(FONT_BOLD, 68)
    semibold = ImageFont.truetype(FONT_BOLD, 34)
    mark_font = ImageFont.truetype(FONT_BOLD, 46)
    body = ImageFont.truetype(FONT_REGULAR, 30)
    small = ImageFont.truetype(FONT_BOLD, 24)

    image = vertical_gradient((WIDTH, HEIGHT), (28, 62, 255), (11, 18, 32))
    image = add_glow(image, (WIDTH * 0.5, HEIGHT * 0.28), 540, (40, 92, 220))

    draw = ImageDraw.Draw(image)

    # --- Brand lockup -------------------------------------------------
    mark_box = [MARGIN, MARGIN, MARGIN + 76, MARGIN + 76]
    draw.rounded_rectangle(mark_box, radius=22, fill=BLUE)
    draw.text(
        (MARGIN + 38, MARGIN + 38),
        "L",
        font=mark_font,
        fill=WHITE,
        anchor="mm",
    )
    draw.text((MARGIN + 100, MARGIN + 38), "LeadBack", font=semibold, fill=WHITE, anchor="lm")

    # --- Headline -----------------------------------------------------
    headline = ["Turn missed inquiries", "into customers."]
    y = 268
    for line in headline:
        draw.text((MARGIN, y), line, font=bold, fill=WHITE, anchor="lm")
        y += 84

    # --- Sub-headline -------------------------------------------------
    draw.text(
        (MARGIN, 470),
        "Recover missed leads, follow up on time, and track",
        font=body,
        fill=MUTED,
        anchor="lm",
    )
    draw.text(
        (MARGIN, 508),
        "the revenue you win back.",
        font=body,
        fill=MUTED,
        anchor="lm",
    )

    # --- Footer strip -------------------------------------------------
    draw.line(
        [(MARGIN, HEIGHT - 96), (WIDTH - MARGIN, HEIGHT - 96)],
        fill=(60, 78, 120),
        width=2,
    )
    draw.text(
        (MARGIN, HEIGHT - 62),
        "leadback.app",
        font=small,
        fill=WHITE,
        anchor="lm",
    )

    pill = "1-month free trial"
    pill_w = text_width(draw, pill, small) + 44
    pill_box = [WIDTH - MARGIN - pill_w, HEIGHT - 88, WIDTH - MARGIN, HEIGHT - 34]
    draw.rounded_rectangle(pill_box, radius=27, fill=BLUE)
    draw.text(
        (WIDTH - MARGIN - pill_w / 2, HEIGHT - 61),
        pill,
        font=small,
        fill=WHITE,
        anchor="mm",
    )

    image.save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} ({os.path.getsize(OUT) / 1024:.1f} kB)")


if __name__ == "__main__":
    main()
