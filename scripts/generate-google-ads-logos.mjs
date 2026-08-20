import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const FONT_URL =
  "https://github.com/tokotype/PlusJakartaSans/raw/master/fonts/ttf/PlusJakartaSans-SemiBold.ttf";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "brand", "google-ads");
mkdirSync(outDir, { recursive: true });

const fontPath = join(tmpdir(), "PlusJakartaSans-SemiBold.ttf");
try {
  readFileSync(fontPath);
} catch {
  const res = await fetch(FONT_URL);
  if (!res.ok) throw new Error(`Failed to download font: ${res.status}`);
  writeFileSync(fontPath, Buffer.from(await res.arrayBuffer()));
}
const fontB64 = readFileSync(fontPath).toString("base64");

const MARK_PATH =
  "M16 16.5 32 46 48 16.5h-7.2L32 35.2 23.2 16.5Z";
const INK = "#1a1814";
const PAPER = "#f7f5f1";

const squareSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${INK}"/>
  <path d="${MARK_PATH}" fill="${PAPER}"/>
</svg>`;

const WIDTH = 1200;
const HEIGHT = 300;
const PAD_X = 36;
const PAD_Y = 28;
const MARK = HEIGHT - PAD_Y * 2;
const GAP = 22;
const textX = PAD_X + MARK + GAP;
const textW = WIDTH - PAD_X - textX;
const markScale = MARK / 64;

const landscapeSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <style>
      @font-face {
        font-family: "Plus Jakarta Sans";
        font-weight: 600;
        src: url("data:font/ttf;base64,${fontB64}") format("truetype");
      }
    </style>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
  <g transform="translate(${PAD_X}, ${PAD_Y})">
    <rect width="${MARK}" height="${MARK}" fill="${INK}"/>
    <g transform="scale(${markScale})">
      <path d="${MARK_PATH}" fill="${PAPER}"/>
    </g>
  </g>
  <text
    x="${textX}"
    y="${HEIGHT / 2}"
    dominant-baseline="middle"
    font-family="Plus Jakarta Sans, Arial, sans-serif"
    font-size="188"
    font-weight="600"
    letter-spacing="-3.5"
    textLength="${textW}"
    lengthAdjust="spacingAndGlyphs"
    fill="${INK}"
  >ardagsstil</text>
</svg>`;

const squarePath = join(outDir, "vardagsstil-square-1200.png");
const landscapePath = join(outDir, "vardagsstil-landscape-1200x300.png");

await sharp(Buffer.from(squareSvg))
  .resize(1200, 1200, { fit: "fill" })
  .png({ compressionLevel: 9 })
  .toFile(squarePath);

await sharp(Buffer.from(landscapeSvg))
  .resize(1200, 300, { fit: "fill" })
  .png({ compressionLevel: 9 })
  .toFile(landscapePath);

for (const path of [squarePath, landscapePath]) {
  const meta = await sharp(path).metadata();
  const { size } = await import("node:fs").then((fs) => fs.promises.stat(path));
  console.log(
    `${path.replace(root + "\\", "")}: ${meta.width}x${meta.height} ${(size / 1024).toFixed(1)} KB`,
  );
}
