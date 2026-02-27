/**
 * render-icon.mjs
 * Renders AMARI app icons from SVG sources using Sharp.
 *
 * Outputs:
 *   assets/adaptive-icon-fg.png  — 512x512, transparent bg, cream monogram (Android adaptive foreground)
 *   assets/store-assets/feature-graphic.png — 1024x500, charcoal + aurora + brand text
 */

import sharp from 'sharp';
import { join } from 'path';

const root = join(import.meta.dirname, '..');
const assetsDir = join(root, 'assets');
const storeDir = join(assetsDir, 'store-assets');

// ─── 1. Adaptive Icon Foreground ───────────────────────────────────────────
// Use the geometric monogram (light on dark variant, but with cream fill on transparent bg)
// The monogram is a stylized "A" made of two polygons + a diagonal slash line
// Safe zone: 66% of 512 = ~338px centered, so the monogram at ~240px is well within safe area

const adaptiveFgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <!-- Transparent background — Android fills the bg color from app.json -->
  <g transform="translate(256, 256) scale(0.75)">
    <polygon points="-100,120 -20,-120 5,-120 -50,120" fill="#f8f6f3"/>
    <polygon points="0,-120 25,-120 110,120 65,120" fill="#f8f6f3"/>
    <line x1="-80" y1="-105" x2="95" y2="115" stroke="#1a1a1a" stroke-width="3.5" stroke-linecap="round"/>
  </g>
</svg>`;

await sharp(Buffer.from(adaptiveFgSvg))
  .resize(512, 512)
  .png()
  .toFile(join(assetsDir, 'adaptive-icon-fg.png'));

console.log('  [OK] adaptive-icon-fg.png (512x512)');

// ─── 2. Feature Graphic ───────────────────────────────────────────────────
// 1024x500, charcoal background, subtle aurora glow, brand text + tagline

const featureGraphicSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <radialGradient id="aurora1" cx="15%" cy="30%" r="35%">
      <stop offset="0%" stop-color="#c9a962" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#c9a962" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="aurora2" cx="85%" cy="65%" r="30%">
      <stop offset="0%" stop-color="#722F37" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#722F37" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="aurora3" cx="50%" cy="80%" r="40%">
      <stop offset="0%" stop-color="#d4b876" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#d4b876" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Base -->
  <rect width="1024" height="500" fill="#1a1a1a"/>

  <!-- Aurora glows -->
  <rect width="1024" height="500" fill="url(#aurora1)"/>
  <rect width="1024" height="500" fill="url(#aurora2)"/>
  <rect width="1024" height="500" fill="url(#aurora3)"/>

  <!-- Small monogram watermark top-left -->
  <g transform="translate(120, 160) scale(0.35)" opacity="0.08">
    <polygon points="-100,120 -20,-120 5,-120 -50,120" fill="#f8f6f3"/>
    <polygon points="0,-120 25,-120 110,120 65,120" fill="#f8f6f3"/>
    <line x1="-80" y1="-105" x2="95" y2="115" stroke="#1a1a1a" stroke-width="3.5" stroke-linecap="round"/>
  </g>

  <!-- Brand name -->
  <text x="512" y="195" text-anchor="middle" fill="#f8f6f3"
        font-family="'Syne', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
        font-size="72" font-weight="800" letter-spacing="-3">AMARI</text>

  <!-- Accent line -->
  <line x1="484" y1="222" x2="540" y2="222" stroke="#722F37" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Tagline -->
  <text x="512" y="268" text-anchor="middle" fill="#d4b876"
        font-family="'EB Garamond', 'Georgia', serif"
        font-size="28" font-style="italic">For the Alchemists</text>

  <!-- Subtitle -->
  <text x="512" y="320" text-anchor="middle" fill="rgba(248,246,243,0.35)"
        font-family="'DM Sans', 'Segoe UI', sans-serif"
        font-size="11" font-weight="600" letter-spacing="4">BY INVITATION ONLY</text>

  <!-- Bottom accent line -->
  <line x1="462" y1="360" x2="562" y2="360" stroke="rgba(201,169,98,0.15)" stroke-width="1" stroke-linecap="round"/>
</svg>`;

await sharp(Buffer.from(featureGraphicSvg))
  .resize(1024, 500)
  .png()
  .toFile(join(storeDir, 'feature-graphic.png'));

console.log('  [OK] feature-graphic.png (1024x500)');

console.log('\nAll icons rendered successfully.');
