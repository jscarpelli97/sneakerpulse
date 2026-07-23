"use client";

import Image from "next/image";
import { isDataImageUrl } from "@/lib/wardrobe/image";

/** Renders inside a `relative` sized box. Supports StockX URLs and data URLs. */
export function ClosetImage({
  src,
  alt,
  /** Prefer a plain <img> so canvas export can read the pixels. */
  exportable = false,
}: {
  src: string;
  alt: string;
  className?: string;
  exportable?: boolean;
}) {
  if (!src) {
    return <div className="absolute inset-0 bg-dash-elevated" aria-hidden />;
  }

  // Data URLs, or exportable remote images via the Next optimizer (same-origin).
  if (isDataImageUrl(src) || exportable) {
    const imgSrc = isDataImageUrl(src)
      ? src
      : `/_next/image?url=${encodeURIComponent(src)}&w=640&q=90`;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imgSrc}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain p-1"
        draggable={false}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-contain p-1"
      sizes="200px"
    />
  );
}
