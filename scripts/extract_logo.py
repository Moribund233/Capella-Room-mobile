"""
Capella Room Logo Extractor
从 prototype/logo.html 中提取 Pulse Node SVG 并转换为 PNG
使用 sharp (Node.js) 作为渲染后端 (Windows 无需 Cairo)
"""

import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

# ─── 配置 ──────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent  # Capella Room/
PROTOTYPE_HTML = PROJECT_ROOT / "prototype" / "logo.html"
MOBILE_ASSETS = PROJECT_ROOT / "capella-room-mobile" / "assets"

# 需要生成的尺寸 (width, height, filename)
SIZES = [
    (1024, 1024, "icon.png"),
    (256, 256, "favicon.png"),
    (512, 512, "splash-icon.png"),
    # Android Adaptive Icon
    (1080, 1080, "android-icon-foreground.png"),
    (1080, 1080, "android-icon-background.png"),
    (1080, 1080, "android-icon-monochrome.png"),
]

# ─── 主 logo SVG (从原型中提取，去掉动画/交互外壳) ─────────────────────
PRIMARY_SVG = '''<svg width="{w}" height="{h}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradOrbit1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9B8AFB" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#7B6AE8" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="gradOrbit2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F4A261" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#F4A261" stop-opacity="0.2"/>
    </linearGradient>
    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#7B6AE8"/>
      <stop offset="100%" stop-color="#5A4BC4"/>
    </radialGradient>
  </defs>
  <rect x="2" y="2" width="96" height="96" rx="24" fill="#1A1A2E"/>
  <circle cx="50" cy="50" r="10" fill="url(#coreGlow)"/>
  <circle cx="50" cy="50" r="18" stroke="#7B6AE8" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.4"/>
  <path d="M25 50 A25 25 0 0 1 75 50" stroke="url(#gradOrbit1)" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <g transform="rotate(60 50 50)">
    <path d="M25 50 A25 25 0 0 1 75 50" stroke="url(#gradOrbit2)" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  </g>
  <circle cx="25" cy="50" r="4" fill="#9B8AFB"/>
  <circle cx="71" cy="62" r="4" fill="#F4A261"/>
</svg>'''

# ─── 透明背景版本 (用于 adaptive icon foreground) ─────────────────────
FOREGROUND_SVG = '''<svg width="{w}" height="{h}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradOrbit1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9B8AFB" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#7B6AE8" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="gradOrbit2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F4A261" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#F4A261" stop-opacity="0.2"/>
    </linearGradient>
    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#7B6AE8"/>
      <stop offset="100%" stop-color="#5A4BC4"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="10" fill="url(#coreGlow)"/>
  <circle cx="50" cy="50" r="18" stroke="#7B6AE8" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.4"/>
  <path d="M25 50 A25 25 0 0 1 75 50" stroke="url(#gradOrbit1)" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <g transform="rotate(60 50 50)">
    <path d="M25 50 A25 25 0 0 1 75 50" stroke="url(#gradOrbit2)" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  </g>
  <circle cx="25" cy="50" r="4" fill="#9B8AFB"/>
  <circle cx="71" cy="62" r="4" fill="#F4A261"/>
</svg>'''

# ─── 深色背景版本 (adaptive icon background) ──────────────────────────
BACKGROUND_SVG = '''<svg width="{w}" height="{h}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="100" height="100" rx="0" fill="#1A1A2E"/>
</svg>'''

# ─── 单色版本 (用于 android monochrome icon) ──────────────────────────
MONOCHROME_SVG = '''<svg width="{w}" height="{h}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="96" height="96" rx="24" fill="#1A1A2E"/>
  <circle cx="50" cy="50" r="10" fill="#E0E0E0"/>
  <circle cx="50" cy="50" r="18" stroke="#E0E0E0" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.4"/>
  <path d="M25 50 A25 25 0 0 1 75 50" stroke="#E0E0E0" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <g transform="rotate(60 50 50)">
    <path d="M25 50 A25 25 0 0 1 75 50" stroke="#E0E0E0" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  </g>
  <circle cx="25" cy="50" r="4" fill="#E0E0E0"/>
  <circle cx="71" cy="62" r="4" fill="#E0E0E0"/>
</svg>'''


SVG_TEMPLATES = {
    "icon.png": ("primary", PRIMARY_SVG),
    "favicon.png": ("primary", FOREGROUND_SVG),
    "splash-icon.png": ("primary", PRIMARY_SVG),
    "android-icon-foreground.png": ("foreground", FOREGROUND_SVG),
    "android-icon-background.png": ("background", BACKGROUND_SVG),
    "android-icon-monochrome.png": ("monochrome", MONOCHROME_SVG),
}


def render_svg_with_sharp(svg_content: str, output_path: Path, width: int, height: int):
    """使用 sharp 渲染 SVG 到 PNG"""
    with tempfile.NamedTemporaryFile(suffix=".svg", delete=False, mode="w", encoding="utf-8") as f:
        f.write(svg_content)
        svg_path = f.name

    try:
        node_script = f"""
        const sharp = require("sharp");
        const fs = require("fs");
        const svg = fs.readFileSync({json.dumps(svg_path)}, "utf-8");
        sharp(Buffer.from(svg))
          .resize({width}, {height})
          .png()
          .toFile({json.dumps(str(output_path))})
          .then(() => console.log("OK"))
          .catch(e => {{ console.error(e.message); process.exit(1); }});
        """
        result = subprocess.run(
            ["node", "-e", node_script],
            capture_output=True, text=True, cwd=str(output_path.parent),
            timeout=30,
        )
        if result.returncode != 0:
            print(f"  [ERR] sharp error: {result.stderr.strip()}")
            return False
        return True
    finally:
        os.unlink(svg_path)


def main():
    print("=" * 60)
    print("  Capella Room — Logo Extractor")
    print("=" * 60)

    # 检查依赖
    try:
        subprocess.run(["node", "--version"], capture_output=True)
    except FileNotFoundError:
        print("[ERR] Node.js not found. Install Node.js >= 18")
        sys.exit(1)

    # 检查 sharp
    check = subprocess.run(
        ["node", "-e", "require('sharp')"],
        capture_output=True, cwd=str(MOBILE_ASSETS),
    )
    if check.returncode != 0:
        # 试试从 mobile 项目找
        mobile_pkg = PROJECT_ROOT / "capella-room-mobile"
        check = subprocess.run(
            ["node", "-e", "require('sharp')"],
            capture_output=True, cwd=str(mobile_pkg),
        )
        if check.returncode != 0:
            print("[ERR] sharp not installed. Run: pnpm add -D sharp")
            sys.exit(1)

    # 确保 assets 目录存在
    MOBILE_ASSETS.mkdir(parents=True, exist_ok=True)

    print(f"\nOutput dir: {MOBILE_ASSETS}")
    print()

    # 渲染每个尺寸
    for filename, (variant, svg_template) in SVG_TEMPLATES.items():
        output_path = MOBILE_ASSETS / filename

        for w, h, fn in SIZES:
            if fn == filename:
                break
        else:
            # fallback: 从文件名匹配 SIZES
            w, h = 1024, 1024
            for sw, sh, sn in SIZES:
                if sn == filename:
                    w, h = sw, sh
                    break

        svg = svg_template.format(w=100, h=100)

        print(f"  [{variant:12s}] {filename:32s} {w:4d}x{h:<4d}  ", end="", flush=True)

        if render_svg_with_sharp(svg, output_path, w, h):
            size_kb = output_path.stat().st_size / 1024
            print(f"[OK] ({size_kb:.1f} KB)")
        else:
            print("[FAIL]")

    print(f"\n[DONE] Files saved to: {MOBILE_ASSETS}")


if __name__ == "__main__":
    main()
