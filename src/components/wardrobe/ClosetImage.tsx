"use client";

import Image from "next/image";
import { isDataImageUrl } from "@/lib/wardrobe/image";

/** Renders inside a `relative` sized box. Supports StockX URLs and data URLs. */
export function ClosetImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return <div className="absolute inset-0 bg-dash-elevated" aria-hidden />;
  }
  if (isDataImageUrl(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
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
