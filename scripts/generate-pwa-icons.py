#!/usr/bin/env python3
"""
Generate PWA icon set for RequityOS portal.
Run from monorepo root: python3 scripts/generate-pwa-icons.py
Requires: pip install Pillow
"""
import base64, re, io, shutil, os, sys

try:
    from PIL import Image
except ImportError:
    print("Pillow not installed. Run: pip install Pillow")
    sys.exit(1)

# Paths (relative to monorepo root)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
PUBLIC_DIR = os.path.join(REPO_ROOT, "apps", "requity-os", "public")
ICONS_DIR = os.path.join(PUBLIC_DIR, "icons")
SVG_PATH = os.path.join(PUBLIC_DIR, "favicon.svg")
ICO_PATH = os.path.join(PUBLIC_DIR, "favicon.ico")

# Also check uploads dir (for first-time setup)
UPLOADS_SVG = os.path.join(REPO_ROOT, "uploads", "favicon.svg")
UPLOADS_ICO = os.path.join(REPO_ROOT, "uploads", "favicon.ico")

os.makedirs(ICONS_DIR, exist_ok=True)

# Find the SVG source
svg_source = None
for path in [SVG_PATH, UPLOADS_SVG]:
    if os.path.exists(path):
        svg_source = path
        break

if not svg_source:
    print(f"ERROR: favicon.svg not found at {SVG_PATH}")
    print("Copy your favicon.svg to apps/requity-os/public/favicon.svg first.")
    sys.exit(1)

# If SVG is not in public/ yet, copy it there
if svg_source != SVG_PATH:
    shutil.copy2(svg_source, SVG_PATH)
    print(f"Copied favicon.svg to {SVG_PATH}")

# Find the ICO source
ico_source = None
for path in [ICO_PATH, UPLOADS_ICO]:
    if os.path.exists(path):
        ico_source = path
        break

# Extract the embedded base64 PNG from the SVG (248x248)
with open(SVG_PATH, "r") as f:
    svg_content = f.read()

match = re.search(r'data:image/png;base64,([A-Za-z0-9+/=]+)', svg_content)
if not match:
    print("ERROR: No embedded base64 PNG found in favicon.svg")
    sys.exit(1)

png_data = base64.b64decode(match.group(1))
source = Image.open(io.BytesIO(png_data)).convert("RGBA")
print(f"Source image extracted: {source.size[0]}x{source.size[1]}")

# Generate all required icon sizes
SIZES = {
    "icon-72x72.png": 72,
    "icon-96x96.png": 96,
    "favicon-96x96.png": 96,
    "icon-128x128.png": 128,
    "icon-144x144.png": 144,
    "icon-152x152.png": 152,
    "apple-touch-icon.png": 180,
    "icon-192x192.png": 192,
    "web-app-manifest-192x192.png": 192,
    "icon-384x384.png": 384,
    "icon-512x512.png": 512,
    "web-app-manifest-512x512.png": 512,
}

print(f"\nGenerating {len(SIZES)} icons into {ICONS_DIR}/")
for filename, size in sorted(SIZES.items(), key=lambda x: x[1]):
    resized = source.resize((size, size), Image.LANCZOS)
    out_path = os.path.join(ICONS_DIR, filename)
    resized.save(out_path, "PNG", optimize=True)
    file_size = os.path.getsize(out_path)
    print(f"  {filename:<40} {size}x{size}  ({file_size:>6,} bytes)")

# Copy favicon.ico and favicon.svg into icons/ (manifest.json references /icons/ paths)
if ico_source:
    shutil.copy2(ico_source, os.path.join(ICONS_DIR, "favicon.ico"))
    # Also ensure it's in public root
    if ico_source != ICO_PATH:
        shutil.copy2(ico_source, ICO_PATH)
    print(f"  {'favicon.ico':<40} copied")
else:
    print("  WARNING: favicon.ico not found, skipping")

shutil.copy2(SVG_PATH, os.path.join(ICONS_DIR, "favicon.svg"))
print(f"  {'favicon.svg':<40} copied")

print(f"\nDone! {len(SIZES) + 2} files written to apps/requity-os/public/icons/")
print("\nNext steps:")
print("  1. Verify icons look correct: open apps/requity-os/public/icons/ in Finder")
print("  2. Commit: git add apps/requity-os/public/icons/ && git commit -m 'Add PWA icon set'")
print("  3. Deploy and test install prompt in Chrome DevTools > Application > Manifest")
