import { FIT_BASE_SIZE } from "@/lib/wardrobe/layout";
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
  return `/_next/image?url=${encodeURIComponent(src)}&w=640&q=90`;
}

/**
 * Load an image into an ImageBitmap without tainting the canvas.
 * Prefers fetch→blob so StockX via /_next/image and data URLs both work.
 */
async function loadBitmap(src: string): Promise<ImageBitmap> {
  const url = sameOriginImageSrc(src);

  if (isDataImageUrl(url) || url.startsWith("blob:")) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not read cutout");
    const blob = await res.blob();
    return createImageBitmap(blob);
  }

  // Same-origin Next image optimizer (or absolute same-origin path).
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) {
    // Last resort: HTMLImageElement (may fail CORS for raw remote).
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Image load failed"));
      el.src = url;
    });
    return createImageBitmap(img);
  }
  const blob = await res.blob();
  return createImageBitmap(blob);
}

function drawContain(
  ctx: CanvasRenderingContext2D,
  img: ImageBitmap | HTMLImageElement,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
) {
  const iw = "naturalWidth" in img ? img.naturalWidth : img.width;
  const ih = "naturalHeight" in img ? img.naturalHeight : img.height;
  if (!iw || !ih) return;
  const scale = Math.min(boxW / iw, boxH / ih);
  const w = iw * scale;
  const h = ih * scale;
  const x = boxX + (boxW - w) / 2;
  const y = boxY + (boxH - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

function pieceSource(item: ClosetItem) {
  return item.cutoutImage || item.image || "";
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
  const errors: string[] = [];

  for (const piece of pieces) {
    const item = closetById.get(piece.closetItemId);
    if (!item) {
      errors.push("missing closet item");
      continue;
    }
    const src = pieceSource(item);
    if (!src) {
      errors.push(`${item.name}: no image`);
      continue;
    }

    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await loadBitmap(src);
      const sizePct = FIT_BASE_SIZE * piece.scale;
      const boxW = (sizePct / 100) * width;
      const boxH = (sizePct / 100) * height;
      const x = (piece.x / 100) * width;
      const y = (piece.y / 100) * height;
      const rotation = ((piece.rotation ?? 0) * Math.PI) / 180;

      ctx.save();
      ctx.translate(x + boxW / 2, y + boxH / 2);
      ctx.rotate(rotation);
      drawContain(ctx, bitmap, -boxW / 2, -boxH / 2, boxW, boxH);
      ctx.restore();
      drawn += 1;
    } catch (err) {
      errors.push(
        `${item.name}: ${err instanceof Error ? err.message : "load failed"}`,
      );
    } finally {
      bitmap?.close();
    }
  }

  if (drawn === 0) {
    return {
      ok: false,
      error:
        errors[0] ??
        "Couldn't load piece images for export — try Remove backgrounds first",
    };
  }

  if (opts?.showName !== false && board.name.trim()) {
    ctx.fillStyle = "#9aa3b2";
    ctx.font = "500 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(board.name.trim().slice(0, 48), width / 2, height - 36);
  }

  let blob: Blob | null = null;
  try {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
    });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Could not encode JPEG (canvas may be blocked)",
    };
  }

  if (!blob) {
    // Fallback via data URL → blob (works when toBlob is flaky).
    try {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const res = await fetch(dataUrl);
      blob = await res.blob();
    } catch {
      return {
        ok: false,
        error: "Could not encode JPEG — try Remove backgrounds, then export again",
      };
    }
  }

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
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Keep the object URL alive briefly so the browser can start the download.
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1500);
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
