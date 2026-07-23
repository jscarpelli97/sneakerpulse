/** Compress an image File to a JPEG data URL suitable for localStorage. */
export async function fileToClosetDataUrl(
  file: File,
  opts?: { maxEdge?: number; quality?: number },
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Choose an image file (PNG, JPG, WebP)" };
  }
  // Keep closet vault small — reject huge sources early.
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: "Image is too large (max 8MB)" };
  }

  const maxEdge = opts?.maxEdge ?? 720;
  const quality = opts?.quality ?? 0.82;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return { ok: false, error: "Could not process image" };
    }
    ctx.fillStyle = "#151922";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length > 900_000) {
      return {
        ok: false,
        error: "Image is still too large after compress — try a simpler PNG",
      };
    }
    return { ok: true, dataUrl };
  } catch {
    return { ok: false, error: "Could not read that image" };
  }
}

export function isDataImageUrl(src: string) {
  return src.startsWith("data:image/");
}
