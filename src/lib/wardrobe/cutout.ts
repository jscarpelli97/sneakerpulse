import { isDataImageUrl } from "@/lib/wardrobe/image";

const MAX_CUTOUT_EDGE = 520;
/** Cap so vault JSON stays healthy (~3 items ≈ fine). */
const MAX_CUTOUT_CHARS = 700_000;

function sameOriginSrc(src: string) {
  if (isDataImageUrl(src) || src.startsWith("/") || src.startsWith("blob:")) {
    return src;
  }
  return `/_next/image?url=${encodeURIComponent(src)}&w=640&q=90`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image for cutout"));
    img.src = sameOriginSrc(src);
  });
}

function colorDist(r: number, g: number, b: number, cr: number, cg: number, cb: number) {
  return Math.abs(r - cr) + Math.abs(g - cg) + Math.abs(b - cb);
}

function isLikelyBg(
  r: number,
  g: number,
  b: number,
  seeds: Array<[number, number, number]>,
  threshold: number,
) {
  // Near-white / light studio backdrops (StockX-style).
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (luma >= 245 && Math.max(r, g, b) - Math.min(r, g, b) < 18) return true;
  for (const [cr, cg, cb] of seeds) {
    if (colorDist(r, g, b, cr, cg, cb) <= threshold) return true;
  }
  return false;
}

/**
 * Remove studio/product backgrounds → transparent PNG data URL.
 * Flood-fills from the edges (works on StockX white/gray plates), then crops
 * to the opaque content so pieces can stack cleanly on a fit board.
 */
export async function imageToCutoutPng(
  src: string,
  opts?: { maxEdge?: number },
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  if (typeof document === "undefined") {
    return { ok: false, error: "Cutouts only work in the browser" };
  }
  if (!src) return { ok: false, error: "No image" };

  // Already a cutout PNG we made — skip rework.
  if (src.startsWith("data:image/png") && src.includes("spi-cutout")) {
    return { ok: true, dataUrl: src };
  }

  try {
    const img = await loadImage(src);
    const maxEdge = opts?.maxEdge ?? MAX_CUTOUT_EDGE;
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { ok: false, error: "Could not process image" };

    ctx.drawImage(img, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Seed background colors from the four corners + edge midpoints.
    const sample = (x: number, y: number): [number, number, number] => {
      const i = (y * w + x) * 4;
      return [data[i], data[i + 1], data[i + 2]];
    };
    const seeds: Array<[number, number, number]> = [
      sample(2, 2),
      sample(w - 3, 2),
      sample(2, h - 3),
      sample(w - 3, h - 3),
      sample(Math.floor(w / 2), 2),
      sample(Math.floor(w / 2), h - 3),
      sample(2, Math.floor(h / 2)),
      sample(w - 3, Math.floor(h / 2)),
    ];

    const threshold = 54;
    const visited = new Uint8Array(w * h);
    const queue: number[] = [];

    const enqueue = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const idx = y * w + x;
      if (visited[idx]) return;
      const p = idx * 4;
      if (!isLikelyBg(data[p], data[p + 1], data[p + 2], seeds, threshold)) return;
      visited[idx] = 1;
      queue.push(idx);
    };

    // Start flood from the full border.
    for (let x = 0; x < w; x++) {
      enqueue(x, 0);
      enqueue(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      enqueue(0, y);
      enqueue(w - 1, y);
    }

    while (queue.length) {
      const idx = queue.pop()!;
      const x = idx % w;
      const y = (idx / w) | 0;
      enqueue(x + 1, y);
      enqueue(x - 1, y);
      enqueue(x, y + 1);
      enqueue(x, y - 1);
    }

    // Soften: any near-bg pixel neighboring a bg pixel fades out.
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const p = idx * 4;
        if (visited[idx]) {
          data[p + 3] = 0;
          continue;
        }
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        if (!isLikelyBg(r, g, b, seeds, threshold + 20)) continue;
        let nearBg = false;
        for (let dy = -1; dy <= 1 && !nearBg; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (visited[ny * w + nx]) {
              nearBg = true;
              break;
            }
          }
        }
        if (nearBg) {
          // Feather edge instead of hard cut.
          data[p + 3] = Math.min(data[p + 3], 90);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Crop to opaque content so empty plate doesn't eat board space.
    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const a = data[(y * w + x) * 4 + 3];
        if (a < 12) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX <= minX || maxY <= minY) {
      // Fallback — return original drawn frame as PNG (no empty crop).
      const fallback = canvas.toDataURL("image/png");
      return { ok: true, dataUrl: fallback };
    }

    const pad = 4;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad);
    maxY = Math.min(h - 1, maxY + pad);
    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;

    const out = document.createElement("canvas");
    out.width = cw;
    out.height = ch;
    const octx = out.getContext("2d");
    if (!octx) return { ok: false, error: "Could not crop cutout" };
    octx.clearRect(0, 0, cw, ch);
    octx.drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);

    // Marker comment embedded via custom — data URLs can't comment; skip.
    let dataUrl = out.toDataURL("image/png");
    if (dataUrl.length > MAX_CUTOUT_CHARS) {
      // Re-encode smaller.
      const shrink = document.createElement("canvas");
      const s = Math.sqrt(MAX_CUTOUT_CHARS / dataUrl.length) * 0.92;
      shrink.width = Math.max(64, Math.round(cw * s));
      shrink.height = Math.max(64, Math.round(ch * s));
      const sctx = shrink.getContext("2d");
      if (!sctx) return { ok: false, error: "Cutout too large" };
      sctx.clearRect(0, 0, shrink.width, shrink.height);
      sctx.drawImage(out, 0, 0, shrink.width, shrink.height);
      dataUrl = shrink.toDataURL("image/png");
      if (dataUrl.length > MAX_CUTOUT_CHARS) {
        return { ok: false, error: "Cutout too large to save" };
      }
    }

    return { ok: true, dataUrl };
  } catch {
    return { ok: false, error: "Could not cut out background" };
  }
}

export function isPngDataUrl(src: string) {
  return src.startsWith("data:image/png");
}
