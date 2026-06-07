---
name: Generating App/Play Store marketing screenshots in the repl
description: How to produce store-sized marketing screenshots without a device or headless browser
---

# Generating store marketing screenshots in the repl

No Playwright/Chromium/Puppeteer is installed by default, but **ImageMagick is**
(`magick`/`convert`) and its SVG delegate is **librsvg (rsvg-convert)** — which
renders SVG (gradients, text, clip-paths, drop-shadows) at high quality.

**How to apply:** compose each marketing frame as an SVG (caption + a device
mockup whose screen mirrors the real app UI, reusing the app's exact palette),
then rasterize per required size with
`magick -background none -density 144 frame.svg -resize WxH! out.png`.

Store sizes that satisfy review:
- iOS 6.7" = 1290x2796, iOS 6.5" = 1242x2688, Google Play phone = 1080x1920.

**Fonts:** only DejaVu ships in fontconfig. To match a brand font (e.g. Inter),
download the TTFs, drop them in `~/.fonts`, run `fc-cache -f`; librsvg then
resolves `font-weight` (400/500/600/700/800) to the registered faces. Inter
release zip has no `unzip` binary available and no `python3`; extract via Node's
`zlib.inflateRawSync` over the zip central directory.

A working generator lives at `artifacts/mobile/store/generate-screenshots.mjs`.
