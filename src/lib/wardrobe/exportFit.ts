import { isDataImageUrl } from "@/lib/wardrobe/image";
import { FIT_BASE_SIZE } from "@/lib/wardrobe/layout";
import type { ClosetItem, FitPiece } from "@/lib/wardrobe/types";

/** Instagram square (1:1) — matches the fit board. */
export const FIT_EXPORT_WIDTH = 1080;
export const FIT_EXPORT_HEIGHT = 1080;

export type FitExportOptions = {
  size?: number;
  quality?: number;
  filename?: string;
  /** Fit name drawn at the bottom. */
  name?: string;
  showName?: boolean;
};

/** Same-origin URL so canvas can read StockX (and other remote) pixels. */
export function toExportImageSrc(src: string): string {
  if (!src) return src;
  if (
    isDataImageUrl(src) ||
    src.startsWith("blob:") ||
    src.startsWith("/")
  ) {
    return src;
  }
  return `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=90`;
}

export function toProxyImageSrc(src: string): string {
  return `/api/wardrobe/image?url=${encodeURIComponent(src)}`;
}

async function bitmapFromBlob(blob: Blob): Promise<ImageBitmap> {
  if (!blob.size) throw new Error("Empty image");
  return createImageBitmap(blob);
}

async function fetchBitmap(url: string, init?: RequestInit): Promise<ImageBitmap> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Image fetch failed (${res.status})`);
  return bitmapFromBlob(await res.blob());
}

/**
 * Fetch an image into a canvas-safe bitmap.
 * Tries Next optimizer → wardrobe proxy → direct CORS fetch.
 */
export async function loadExportBitmap(src: string): Promise<ImageBitmap> {
  if (!src) throw new Error("No image");

  if (isDataImageUrl(src) || src.startsWith("blob:")) {
    return fetchBitmap(src);
  }

  // Already same-origin path.
  if (src.startsWith("/")) {
    return fetchBitmap(src, { cache: "force-cache" });
  }

  const errors: string[] = [];

  try {
    return await fetchBitmap(toExportImageSrc(src), { cache: "force-cache" });
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "next/image failed");
  }

  try {
    return await fetchBitmap(toProxyImageSrc(src), { cache: "force-cache" });
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "proxy failed");
  }

  try {
    return await fetchBitmap(src, { mode: "cors", cache: "force-cache" });
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "direct fetch failed");
  }

  throw new Error(errors[0] || "Could not load image for export");
}

function encodeCanvasJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob && blob.size > 0) {
          resolve(blob);
          return;
        }
        try {
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          const bin = atob(dataUrl.split(",")[1] ?? "");
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          const fallback = new Blob([bytes], { type: "image/jpeg" });
          if (!fallback.size) {
            reject(new Error("JPEG encode failed"));
            return;
          }
          resolve(fallback);
        } catch (err) {
          reject(err instanceof Error ? err : new Error("JPEG encode failed"));
        }
      },
      "image/jpeg",
      quality,
    );
  });
}

export function exportFilename(label: string, explicit?: string): string {
  const safe = (explicit || label || "fit")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${safe || "fit"}-spi.jpg`;
}

/**
 * Build a white 1:1 JPEG from fit piece data + closet images.
 * Draws onto canvas from fetched bitmaps — no DOM screenshot libraries.
 */
export async function exportFitBoardJpeg(
  _boardEl: HTMLElement | null,
  pieces: FitPiece[],
  closetById: Map<string, ClosetItem>,
  opts?: FitExportOptions,
): Promise<{ ok: true; blob: Blob; filename: string } | { ok: false; error: string }> {
  void _boardEl;

  if (typeof document === "undefined") {
    return { ok: false, error: "Export only works in the browser" };
  }

  const size = opts?.size ?? FIT_EXPORT_WIDTH;
  const quality = opts?.quality ?? 0.92;

  if (pieces.length === 0) {
    return { ok: false, error: "Add pieces to the fit before exporting" };
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { ok: false, error: "Could not create canvas" };

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  const ordered = [...pieces].sort((a, b) => a.zIndex - b.zIndex);
  let drawn = 0;
  let lastError = "";

  for (const piece of ordered) {
    const item = closetById.get(piece.closetItemId);
    if (!item) continue;
    const src = item.cutoutImage || item.image;
    if (!src) continue;

    let bitmap: ImageBitmap;
    try {
      bitmap = await loadExportBitmap(src);
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Image load failed";
      continue;
    }

    const boxPct = FIT_BASE_SIZE * piece.scale;
    const box = Math.max(1, (boxPct / 100) * size);
    const x = (piece.x / 100) * size;
    const y = (piece.y / 100) * size;
    const rotation = piece.rotation ?? 0;
    const pad = box * 0.04;
    const inner = Math.max(1, box - pad * 2);
    const fit = Math.min(inner / bitmap.width, inner / bitmap.height);
    const dw = bitmap.width * fit;
    const dh = bitmap.height * fit;

    ctx.save();
    ctx.translate(x + box / 2, y + box / 2);
    if (rotation) ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(bitmap, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    bitmap.close();
    drawn += 1;
  }

  if (drawn === 0) {
    return {
      ok: false,
      error:
        lastError ||
        "Couldn't load fit images for export — wait a second and try again",
    };
  }

  if (opts?.showName && opts.name?.trim()) {
    const label = opts.name.trim();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.font = `600 ${Math.round(size * 0.028)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(label, size / 2, size - Math.round(size * 0.035));
  }

  let blob: Blob;
  try {
    blob = await encodeCanvasJpeg(canvas, quality);
  } catch {
    return { ok: false, error: "Could not encode JPEG" };
  }

  return {
    ok: true,
    blob,
    filename: exportFilename(opts?.name ?? "", opts?.filename),
  };
}

function isMobileUa(ua: string) {
  return /iPhone|iPad|iPod|Android/i.test(ua);
}

function isAbortError(err: unknown) {
  if (!(err instanceof Error)) return false;
  return /AbortError|canceled|cancelled/i.test(err.name + err.message);
}

/**
 * Save the JPEG. On phones, prefer the share sheet (Save Image / Instagram).
 * Always falls back to a real file download.
 */
export async function saveOrShareJpeg(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: "image/jpeg" });
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const mobile = isMobileUa(ua);

  if (
    mobile &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  ) {
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
        });
        return { mode: "share" as const };
      }
    } catch (err) {
      if (isAbortError(err)) return { mode: "cancelled" as const };
    }
  }

  downloadBlob(blob, filename);
  return { mode: "download" as const };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.type = "image/jpeg";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 60_000);
}

/** Placement math helper for tests. */
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
