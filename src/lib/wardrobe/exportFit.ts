import {
  FIT_BASE_SIZE,
  centerToOrigin,
} from "@/lib/wardrobe/layout";
import { isDataImageUrl } from "@/lib/wardrobe/image";
import type { ClosetItem, FitBoard, FitPiece } from "@/lib/wardrobe/types";

/** Instagram square (1:1) — matches the fit board. */
export const FIT_EXPORT_WIDTH = 1080;
export const FIT_EXPORT_HEIGHT = 1080;

export type FitExportOptions = {
  width?: number;
  height?: number;
  /** Solid background — white for IG lookbook posts. */
  background?: string;
  quality?: number;
  /** Optional fit name drawn small at the bottom. */
  showName?: boolean;
};

function sameOriginImageSrc(src: string) {
  if (isDataImageUrl(src) || src.startsWith("/") || src.startsWith("blob:")) {
    return src;
  }
  // Route remote StockX (etc.) through Next image optimizer so canvas isn't tainted.
  return `/_next/image?url=${encodeURIComponent(src)}&w=640&q=85`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    // data/blob/same-origin don't need crossOrigin; remote via /_next/image is same-origin.
    if (!isDataImageUrl(src) && !src.startsWith("/") && !src.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image`));
    img.src = sameOriginImageSrc(src);
  });
}

function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
) {
  const scale = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = boxX + (boxW - w) / 2;
  const y = boxY + (boxH - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

/**
 * Render a fit board to a white (or custom) JPEG for Instagram / download.
 * Matches FitCanvas placement math (%, base size, rotation).
 */
export async function exportFitJpeg(
  board: FitBoard,
  closetById: Map<string, ClosetItem>,
  opts?: FitExportOptions,
): Promise<{ ok: true; blob: Blob; filename: string } | { ok: false; error: string }> {
  if (typeof document === "undefined") {
    return { ok: false, error: "Export only works in the browser" };
  }

  const width = opts?.width ?? FIT_EXPORT_WIDTH;
  const height = opts?.height ?? FIT_EXPORT_HEIGHT;
  const background = opts?.background ?? "#ffffff";
  const quality = opts?.quality ?? 0.92;

  const pieces = [...board.pieces].sort((a, b) => a.zIndex - b.zIndex);
  if (pieces.length === 0) {
    return { ok: false, error: "Add pieces to the fit before exporting" };
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { ok: false, error: "Could not create canvas" };

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  let drawn = 0;
  for (const piece of pieces) {
        const item = closetById.get(piece.closetItemId);
    if (!item?.image && !item?.cutoutImage) continue;
    try {
      const img = await loadImage(item.cutoutImage || item.image);
      const sizePct = FIT_BASE_SIZE * piece.scale;
      const boxW = (sizePct / 100) * width;
      const boxH = (sizePct / 100) * width; // square cell like the UI
      const x = (piece.x / 100) * width;
      const y = (piece.y / 100) * height;
      const rotation = ((piece.rotation ?? 0) * Math.PI) / 180;

      ctx.save();
      ctx.translate(x + boxW / 2, y + boxH / 2);
      ctx.rotate(rotation);
      drawContain(ctx, img, -boxW / 2, -boxH / 2, boxW, boxH);
      ctx.restore();
      drawn += 1;
    } catch {
      // Skip broken/tainted images; keep exporting the rest.
    }
  }

  if (drawn === 0) {
    return {
      ok: false,
      error: "Couldn't load piece images for export — try again in a moment",
    };
  }

  if (opts?.showName !== false && board.name.trim()) {
    ctx.fillStyle = "#9aa3b2";
    ctx.font = "500 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(board.name.trim().slice(0, 48), width / 2, height - 36);
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
  );
  if (!blob) return { ok: false, error: "Could not encode JPEG" };

  const safe = board.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const filename = `${safe || "fit"}-spi.jpg`;
  return { ok: true, blob, filename };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** @internal helper for tests — placement math shared with export. */
export function pieceBox(
  piece: FitPiece,
  canvasW: number,
  canvasH: number,
) {
  const sizePct = FIT_BASE_SIZE * piece.scale;
  const boxW = (sizePct / 100) * canvasW;
  const boxH = (sizePct / 100) * canvasW;
  return {
    x: (piece.x / 100) * canvasW,
    y: (piece.y / 100) * canvasH,
    boxW,
    boxH,
    rotation: piece.rotation ?? 0,
  };
}

export { centerToOrigin };
