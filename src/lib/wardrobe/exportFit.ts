import { FIT_BASE_SIZE } from "@/lib/wardrobe/layout";
import type { FitPiece } from "@/lib/wardrobe/types";

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

function encodeCanvasJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        try {
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          const bin = atob(dataUrl.split(",")[1] ?? "");
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          resolve(new Blob([bytes], { type: "image/jpeg" }));
        } catch (err) {
          reject(err instanceof Error ? err : new Error("JPEG encode failed"));
        }
      },
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Export the live fit board DOM to a white square JPEG.
 * Draws already-loaded <img> nodes so StockX / Next image / cutouts all work.
 */
export async function exportFitBoardJpeg(
  boardEl: HTMLElement,
  opts?: FitExportOptions,
): Promise<{ ok: true; blob: Blob; filename: string } | { ok: false; error: string }> {
  if (typeof document === "undefined") {
    return { ok: false, error: "Export only works in the browser" };
  }

  const size = opts?.size ?? FIT_EXPORT_WIDTH;
  const quality = opts?.quality ?? 0.92;
  const rootRect = boardEl.getBoundingClientRect();
  if (rootRect.width < 8 || rootRect.height < 8) {
    return { ok: false, error: "Board isn't ready to export yet" };
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { ok: false, error: "Could not create canvas" };

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  const sx = size / rootRect.width;
  const sy = size / rootRect.height;

  const nodes = boardEl.querySelectorAll<HTMLElement>("[data-fit-piece]");
  if (nodes.length === 0) {
    return { ok: false, error: "Add pieces to the fit before exporting" };
  }

  let drawn = 0;
  for (const node of nodes) {
    const img = node.querySelector("img");
    if (!img) continue;
    if (!img.complete || img.naturalWidth === 0) {
      try {
        await img.decode();
      } catch {
        continue;
      }
    }
    if (!img.naturalWidth) continue;

    const r = node.getBoundingClientRect();
    const x = (r.left - rootRect.left) * sx;
    const y = (r.top - rootRect.top) * sy;
    const w = Math.max(1, r.width * sx);
    const h = Math.max(1, r.height * sy);
    const rotation = Number(node.dataset.rotation || "0") || 0;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    const fit = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * fit;
    const dh = img.naturalHeight * fit;
    try {
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      drawn += 1;
    } catch {
      // Tainted or broken source — skip this piece.
    }
    ctx.restore();
  }

  if (drawn === 0) {
    return {
      ok: false,
      error:
        "Couldn't read board images — wait a second for them to load, then try again",
    };
  }

  const label = opts?.name?.trim();
  if (opts?.showName !== false && label) {
    ctx.fillStyle = "#9aa3b2";
    ctx.font = "500 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label.slice(0, 48), size / 2, size - 36);
  }

  let blob: Blob;
  try {
    blob = await encodeCanvasJpeg(canvas, quality);
  } catch {
    return { ok: false, error: "Could not encode JPEG" };
  }

  const safe = (opts?.filename || label || "fit")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return { ok: true, blob, filename: `${safe || "fit"}-spi.jpg` };
}

/** Download or open the system share sheet (mobile-friendly). */
export async function saveOrShareJpeg(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: "image/jpeg" });

  try {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: filename,
      });
      return { mode: "share" as const };
    }
  } catch (err) {
    if (
      err instanceof Error &&
      /AbortError|canceled|cancelled/i.test(err.name + err.message)
    ) {
      return { mode: "cancelled" as const };
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
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 2500);
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
