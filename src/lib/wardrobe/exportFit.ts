import { toJpeg } from "html-to-image";
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

/**
 * Export the live fit board DOM to a white square JPEG via html-to-image.
 * Captures whatever is painted (Next/Image + cutout PNGs), so export matches the board.
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

  const pieces = boardEl.querySelectorAll("[data-fit-piece]");
  if (pieces.length === 0) {
    return { ok: false, error: "Add pieces to the fit before exporting" };
  }

  const imgs = Array.from(boardEl.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      if (img.complete && img.naturalWidth > 0) return;
      try {
        await img.decode();
      } catch {
        // Ignore — html-to-image may still pick it up after a short wait.
      }
    }),
  );
  await new Promise<void>((r) => requestAnimationFrame(() => r()));

  const pixelRatio = Math.max(2, size / Math.max(rootRect.width, 1));

  let dataUrl: string;
  try {
    dataUrl = await toJpeg(boardEl, {
      quality,
      backgroundColor: "#ffffff",
      pixelRatio,
      cacheBust: true,
      width: rootRect.width,
      height: rootRect.height,
      style: {
        backgroundColor: "#ffffff",
        backgroundImage: "none",
        borderRadius: "0",
        border: "none",
      },
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return true;
        if (node.hasAttribute("data-fit-guide")) return false;
        if (node.hasAttribute("data-fit-chrome")) return false;
        return true;
      },
    });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Couldn't capture the board — try again after images load",
    };
  }

  let blob: Blob;
  try {
    const res = await fetch(dataUrl);
    blob = await res.blob();
  } catch {
    return { ok: false, error: "Could not encode JPEG" };
  }
  if (!blob.size) {
    return { ok: false, error: "Export produced an empty image" };
  }

  // Optional fit name footer — stamp onto a final 1080 canvas so IG size is exact.
  try {
    blob = await stampToSquare(blob, size, opts);
  } catch {
    // Keep the raw capture if stamping fails.
  }

  const label = opts?.name ?? "";
  const safe = (opts?.filename || label || "fit")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return { ok: true, blob, filename: `${safe || "fit"}-spi.jpg` };
}

async function stampToSquare(
  source: Blob,
  size: number,
  opts?: FitExportOptions,
): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return source;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bitmap, 0, 0, size, size);
  bitmap.close();

  if (opts?.showName && opts.name?.trim()) {
    const label = opts.name.trim();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.font = `600 ${Math.round(size * 0.028)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(label, size / 2, size - Math.round(size * 0.035));
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("JPEG encode failed"))),
      "image/jpeg",
      opts?.quality ?? 0.92,
    );
  });
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
