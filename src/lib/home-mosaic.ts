/** Uniform mosaic — every cell the same size. */
export const HERO_MOSAIC_TILE_COUNT = 24;

/** Allowed in the mosaic: square or taller — not landscape. */
export function isPortraitOrSquare(width: number, height: number) {
  if (!width || !height) return true;
  return height >= width;
}
