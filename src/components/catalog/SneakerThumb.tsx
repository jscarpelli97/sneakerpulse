"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

type PreviewPos = { left: number; top: number };

/**
 * Small board thumbnail with a floating enlarged preview on hover/focus.
 * Preview portals to document.body so table overflow doesn't clip it.
 */
export function SneakerThumb({
  src,
  alt,
  size = 44,
  previewWidth = 280,
  className = "",
}: {
  src: string;
  alt: string;
  size?: number;
  previewWidth?: number;
  className?: string;
}) {
  const previewId = useId();
  const [pos, setPos] = useState<PreviewPos | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const place = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const gap = 14;
    const approxH = previewWidth * 0.72;
    let left = rect.right + gap;
    let top = rect.top + rect.height / 2 - approxH / 2;

    if (left + previewWidth > window.innerWidth - 12) {
      left = rect.left - previewWidth - gap;
    }
    if (left < 12) left = 12;
    if (top < 12) top = 12;
    if (top + approxH > window.innerHeight - 12) {
      top = Math.max(12, window.innerHeight - approxH - 12);
    }
    setPos({ left, top });
  }, [previewWidth]);

  function show(event: MouseEvent<HTMLElement>) {
    place(event.currentTarget);
  }

  function hide() {
    setPos(null);
  }

  return (
    <>
      <span
        className={`relative shrink-0 overflow-hidden rounded-lg border border-dash-border bg-dash-elevated ${className}`}
        style={{ width: size, height: size }}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain p-1"
          sizes={`${size}px`}
        />
      </span>
      {mounted && pos
        ? createPortal(
            <div
              id={previewId}
              role="img"
              aria-label={alt}
              className="pointer-events-none fixed z-[200] animate-rise overflow-hidden rounded-2xl border border-dash-border bg-dash-bg shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
              style={{
                left: pos.left,
                top: pos.top,
                width: previewWidth,
              }}
            >
              <div
                className="relative bg-dash-elevated"
                style={{ aspectRatio: "7 / 5" }}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-contain p-4"
                  sizes={`${previewWidth}px`}
                  priority
                />
              </div>
              <p className="truncate border-t border-dash-border px-3 py-2 text-xs text-dash-muted">
                {alt}
              </p>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
