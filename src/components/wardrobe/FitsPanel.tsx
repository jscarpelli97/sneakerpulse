"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ClosetImage } from "@/components/wardrobe/ClosetImage";
import {
  newFitId,
  newFitPieceId,
} from "@/lib/portfolio/vault";
import {
  exportFitBoardJpeg,
  saveOrShareJpeg,
} from "@/lib/wardrobe/exportFit";
import { imageToCutoutPng } from "@/lib/wardrobe/cutout";
import {
  autoOrganizePieces,
  alignPiecesCenter,
  groupAndCenterPieces,
  FIT_BASE_SIZE,
  FIT_CENTER_X,
  snapCenterX,
} from "@/lib/wardrobe/layout";
import {
  CLOSET_KIND_LABELS,
  type ClosetItem,
  type FitBoard,
  type FitPiece,
} from "@/lib/wardrobe/types";

export function FitsPanel({
  closet,
  fits,
  onChange,
  onClosetChange,
  onFlash,
}: {
  closet: ClosetItem[];
  fits: FitBoard[];
  onChange: (next: FitBoard[]) => void;
  onClosetChange: (next: ClosetItem[]) => void;
  onFlash: (message: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(fits[0]?.id ?? null);
  const active = fits.find((f) => f.id === activeId) ?? null;

  useEffect(() => {
    if (activeId && fits.some((f) => f.id === activeId)) return;
    setActiveId(fits[0]?.id ?? null);
  }, [fits, activeId]);

  function createFit() {
    const now = new Date().toISOString();
    const board: FitBoard = {
      id: newFitId(),
      name: `Fit ${fits.length + 1}`,
      notes: "",
      pieces: [],
      createdAt: now,
      updatedAt: now,
    };
    onChange([board, ...fits]);
    setActiveId(board.id);
    onFlash("New fit board");
  }

  function updateActive(patch: Partial<FitBoard>) {
    if (!active) return;
    const next = fits.map((board) =>
      board.id === active.id
        ? { ...board, ...patch, updatedAt: new Date().toISOString() }
        : board,
    );
    onChange(next);
  }

  function removeFit(id: string) {
    onChange(fits.filter((f) => f.id !== id));
    if (activeId === id) setActiveId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
            Fits
          </h2>
          <p className="text-sm text-dash-muted">
            Auto-stack into a look, free-transform pieces, export a white JPEG
            for Instagram.
          </p>
        </div>
        <button
          type="button"
          onClick={createFit}
          className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110"
        >
          New fit
        </button>
      </div>

      {fits.length === 0 ? (
        <div className="dash-card px-5 py-12 text-center">
          <p className="text-sm text-dash-muted">
            No fits yet. Add a few closet pieces, then create a board.
          </p>
          <button
            type="button"
            onClick={createFit}
            className="mt-4 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold hover:bg-dash-elevated"
          >
            Create your first fit
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <ul className="dash-card divide-y divide-dash-border overflow-hidden self-start">
            {fits.map((board) => (
              <li key={board.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(board.id)}
                  className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left ${
                    board.id === activeId
                      ? "bg-dash-accent/10"
                      : "hover:bg-dash-elevated"
                  }`}
                >
                  <span className="truncate text-sm font-semibold text-dash-text">
                    {board.name}
                  </span>
                  <span className="text-[11px] text-dash-faint">
                    {board.pieces.length} piece
                    {board.pieces.length === 1 ? "" : "s"}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {active ? (
            <FitEditor
              board={active}
              closet={closet}
              onChange={updateActive}
              onClosetChange={onClosetChange}
              onDelete={() => removeFit(active.id)}
              onFlash={onFlash}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function FitEditor({
  board,
  closet,
  onChange,
  onClosetChange,
  onDelete,
  onFlash,
}: {
  board: FitBoard;
  closet: ClosetItem[];
  onChange: (patch: Partial<FitBoard>) => void;
  onClosetChange: (next: ClosetItem[]) => void;
  onDelete: () => void;
  onFlash: (message: string) => void;
}) {
  const [closetQuery, setClosetQuery] = useState("");
  const [cuttingOut, setCuttingOut] = useState(false);
  const byId = useMemo(() => {
    const map = new Map<string, ClosetItem>();
    for (const item of closet) map.set(item.id, item);
    return map;
  }, [closet]);

  const closetHits = useMemo(() => {
    const q = closetQuery.trim().toLowerCase();
    if (!q) return closet;
    return closet.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        CLOSET_KIND_LABELS[item.kind].toLowerCase().includes(q) ||
        (item.styleCode?.toLowerCase().includes(q) ?? false),
    );
  }, [closet, closetQuery]);

  const missing = board.pieces.filter((p) => !byId.has(p.closetItemId)).length;
  const [exporting, setExporting] = useState(false);
  const [freeTransform, setFreeTransform] = useState(true);
  /** In-memory cutouts — not written to vault (keeps cloud vault under size cap). */
  const [cutouts, setCutouts] = useState<Record<string, string>>({});
  const boardRef = useRef<HTMLDivElement | null>(null);

  const boardItemIds = useMemo(
    () => board.pieces.map((p) => p.closetItemId),
    [board.pieces],
  );

  const displayById = useMemo(() => {
    const map = new Map<string, ClosetItem>();
    for (const item of closet) {
      const cut = cutouts[item.id] || item.cutoutImage || null;
      map.set(item.id, cut ? { ...item, cutoutImage: cut } : item);
    }
    return map;
  }, [closet, cutouts]);

  /** Ensure every piece on this fit has a transparent PNG cutout (memory only). */
  const ensureCutouts = useCallback(async () => {
    const needs = boardItemIds
      .map((id) => byId.get(id))
      .filter((item): item is ClosetItem =>
        Boolean(item && !cutouts[item.id] && !item.cutoutImage),
      );
    if (needs.length === 0) {
      return { updated: 0, failed: 0 };
    }

    setCuttingOut(true);
    let updated = 0;
    let failed = 0;
    const next: Record<string, string> = { ...cutouts };
    try {
      for (const item of needs) {
        const result = await imageToCutoutPng(item.image);
        if (!result.ok) {
          failed += 1;
          continue;
        }
        next[item.id] = result.dataUrl;
        updated += 1;
      }
      if (updated > 0) setCutouts(next);
      return { updated, failed };
    } finally {
      setCuttingOut(false);
    }
  }, [boardItemIds, byId, cutouts]);

  // Auto-cutout when pieces are added to the board.
  useEffect(() => {
    const needs = boardItemIds.some((id) => {
      const item = byId.get(id);
      return item && !cutouts[id] && !item.cutoutImage;
    });
    if (!needs || cuttingOut) return;
    void ensureCutouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardItemIds.join("|")]);

  function addPiece(closetItemId: string) {
    if (board.pieces.some((p) => p.closetItemId === closetItemId)) {
      onFlash("Already on this fit");
      return;
    }
    const n = board.pieces.length;
    const piece: FitPiece = {
      id: newFitPieceId(),
      closetItemId,
      x: 18 + (n % 4) * 16,
      y: 12 + Math.floor(n / 4) * 22,
      scale: 1,
      rotation: 0,
      zIndex: n + 1,
    };
    onChange({ pieces: [...board.pieces, piece] });
  }

  function patchPiece(id: string, patch: Partial<FitPiece>) {
    onChange({
      pieces: board.pieces.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  }

  function removePiece(id: string) {
    onChange({ pieces: board.pieces.filter((p) => p.id !== id) });
  }

  function bringFront(id: string) {
    const maxZ = board.pieces.reduce((m, p) => Math.max(m, p.zIndex), 0);
    patchPiece(id, { zIndex: maxZ + 1 });
  }

  /** Factory layout: equal locked slots, no overlap, even margins. */
  async function resetToFactory() {
    if (board.pieces.length === 0) {
      onFlash("Add pieces first");
      return;
    }
    await ensureCutouts();
    onChange({ pieces: autoOrganizePieces(board.pieces, displayById) });
    onFlash("Reset to factory layout");
  }

  async function autoArrange() {
    await resetToFactory();
  }

  function alignCenter() {
    if (board.pieces.length === 0) return;
    onChange({ pieces: alignPiecesCenter(board.pieces, displayById) });
    onFlash("Locked to equal slots");
  }

  function groupAndCenter() {
    if (board.pieces.length === 0) {
      onFlash("Add pieces first");
      return;
    }
    onChange({ pieces: groupAndCenterPieces(board.pieces, displayById) });
    onFlash(
      board.pieces.length === 1
        ? "Centered on the board"
        : "Grouped and centered",
    );
  }

  async function makeCutouts() {
    const cut = await ensureCutouts();
    if (cut.updated === 0 && cut.failed === 0) {
      onFlash("Cutouts already ready");
      return;
    }
    if (cut.updated) {
      onFlash(
        `Removed backgrounds on ${cut.updated} piece${cut.updated === 1 ? "" : "s"}`,
      );
    }
    if (cut.failed) {
      onFlash(`Couldn't cut ${cut.failed} — try again`);
    }
  }

  async function exportWhiteJpeg() {
    if (exporting) return;
    const el = boardRef.current;
    if (!el) {
      onFlash("Board isn't ready — try again");
      return;
    }
    setExporting(true);
    try {
      // Let forceWhite paint before capture.
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await new Promise((r) => window.setTimeout(r, 50));

      const result = await exportFitBoardJpeg(el, board.pieces, displayById, {
        name: board.name,
        showName: false,
      });
      if (!result.ok) {
        onFlash(result.error);
        return;
      }
      const saved = await saveOrShareJpeg(result.blob, result.filename);
      if (saved.mode === "share") {
        onFlash("Shared — pick Save Image or Instagram");
      } else if (saved.mode === "download") {
        onFlash("Downloaded — check your downloads folder");
      } else if (saved.mode === "cancelled") {
        onFlash("Export cancelled");
      }
    } catch (err) {
      onFlash(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="dash-card space-y-3 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="text-xs text-dash-faint">
            Fit name
            <input
              value={board.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none focus:border-dash-accent"
            />
          </label>
          <button
            type="button"
            onClick={onDelete}
            className="self-end rounded-xl border border-dash-border px-3 py-2.5 text-sm text-dash-down hover:bg-dash-elevated"
          >
            Delete fit
          </button>
        </div>
        <label className="block text-xs text-dash-faint">
          Notes
          <input
            value={board.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Mocha locker room energy…"
            className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none focus:border-dash-accent"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void makeCutouts()}
            disabled={cuttingOut || board.pieces.length === 0}
            className="rounded-xl border border-dash-border bg-dash-elevated px-3 py-2 text-sm font-semibold text-dash-text hover:border-dash-muted disabled:opacity-40"
          >
            {cuttingOut ? "Cutting…" : "Remove backgrounds"}
          </button>
          <button
            type="button"
            onClick={() => void resetToFactory()}
            disabled={board.pieces.length === 0}
            className="rounded-xl border border-dash-border px-3 py-2 text-sm font-semibold text-dash-text hover:border-dash-muted disabled:opacity-40"
          >
            Reset to factory
          </button>
          <button
            type="button"
            onClick={() => void autoArrange()}
            className="rounded-xl border border-dash-border px-3 py-2 text-sm font-semibold text-dash-text hover:border-dash-muted"
          >
            Auto arrange
          </button>
          <button
            type="button"
            onClick={alignCenter}
            disabled={board.pieces.length === 0}
            className="rounded-xl border border-dash-border px-3 py-2 text-sm font-semibold text-dash-text hover:border-dash-muted disabled:opacity-40"
          >
            Align center
          </button>
          <button
            type="button"
            onClick={groupAndCenter}
            disabled={board.pieces.length === 0}
            className="rounded-xl border border-dash-border px-3 py-2 text-sm font-semibold text-dash-text hover:border-dash-muted disabled:opacity-40"
          >
            Group & center
          </button>
          <button
            type="button"
            onClick={() => setFreeTransform((v) => !v)}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
              freeTransform
                ? "border-dash-accent/50 bg-dash-accent/10 text-dash-accent"
                : "border-dash-border text-dash-muted hover:border-dash-muted hover:text-dash-text"
            }`}
          >
            Free transform {freeTransform ? "on" : "off"}
          </button>
          <button
            type="button"
            onClick={() => void exportWhiteJpeg()}
            disabled={exporting || board.pieces.length === 0}
            className="rounded-xl bg-dash-accent px-3 py-2 text-sm font-semibold text-dash-bg hover:brightness-110 disabled:opacity-40"
          >
            {exporting ? "Exporting…" : "Export JPEG"}
          </button>
        </div>
        <p className="text-[11px] text-dash-faint">
          Group & center packs pieces into a tight stack in the middle. Reset to
          factory spreads equal slots. Export is a white 1:1 JPEG.
        </p>
        {missing ? (
          <p className="text-xs text-dash-down">
            {missing} piece{missing === 1 ? "" : "s"} missing from closet
            (removed items stay off the board).
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
        <FitCanvas
          boardRef={boardRef}
          pieces={board.pieces}
          byId={displayById}
          freeTransform={freeTransform}
          forceWhite={exporting}
          onMove={(id, x, y) => patchPiece(id, { x, y })}
          onSelect={bringFront}
          onScale={(id, scale) => patchPiece(id, { scale })}
          onRotate={(id, rotation) => patchPiece(id, { rotation })}
          onRemove={removePiece}
        />

        <aside className="dash-card max-h-[560px] overflow-y-auto self-start">
          <div className="space-y-2 border-b border-dash-border px-3 py-3">
            <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
              Closet
            </p>
            <input
              value={closetQuery}
              onChange={(e) => setClosetQuery(e.target.value)}
              placeholder="Find piece…"
              className="w-full rounded-lg border border-dash-border bg-dash-elevated px-2.5 py-1.5 text-xs text-dash-text outline-none focus:border-dash-accent"
            />
          </div>
          {closet.length === 0 ? (
            <p className="px-3 py-6 text-sm text-dash-faint">
              Closet is empty — add pieces first.
            </p>
          ) : closetHits.length === 0 ? (
            <p className="px-3 py-6 text-sm text-dash-faint">
              No closet matches for “{closetQuery.trim()}”.
            </p>
          ) : (
            <ul className="divide-y divide-dash-border">
              {closetHits.map((item) => {
                const onBoard = board.pieces.some(
                  (p) => p.closetItemId === item.id,
                );
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => addPiece(item.id)}
                      disabled={onBoard}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-dash-elevated disabled:opacity-40"
                    >
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-dash-elevated">
                        <ClosetImage src={item.image} alt="" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold">
                          {item.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-dash-faint">
                          {CLOSET_KIND_LABELS[item.kind]}
                          {onBoard ? " · on board" : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

function FitCanvas({
  boardRef,
  pieces,
  byId,
  freeTransform,
  forceWhite = false,
  onMove,
  onSelect,
  onScale,
  onRotate,
  onRemove,
}: {
  boardRef: MutableRefObject<HTMLDivElement | null>;
  pieces: FitPiece[];
  byId: Map<string, ClosetItem>;
  freeTransform: boolean;
  forceWhite?: boolean;
  onMove: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
  onScale: (id: string, scale: number) => void;
  onRotate: (id: string, rotation: number) => void;
  onRemove: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [whitePreview, setWhitePreview] = useState(false);
  const [showCenterGuide, setShowCenterGuide] = useState(false);
  const white = forceWhite || whitePreview;

  useEffect(() => {
    boardRef.current = ref.current;
    return () => {
      if (boardRef.current === ref.current) boardRef.current = null;
    };
  }, [boardRef]);
  const drag = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const transform = useRef<{
    id: string;
    mode: "scale" | "rotate";
    startX: number;
    startY: number;
    startScale: number;
    startRotation: number;
  } | null>(null);

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();

      if (transform.current) {
        const t = transform.current;
        const piece = pieces.find((p) => p.id === t.id);
        if (!piece) return;
        const size = FIT_BASE_SIZE * piece.scale;
        const cx = ((piece.x + size / 2) / 100) * rect.width;
        const cy = ((piece.y + size / 2) / 100) * rect.height;
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;

        if (t.mode === "scale") {
          const startDist = Math.hypot(t.startX - cx, t.startY - cy) || 1;
          const dist = Math.hypot(px - cx, py - cy);
          const next = Math.min(
            1.8,
            Math.max(0.45, t.startScale * (dist / startDist)),
          );
          onScale(t.id, next);
        } else {
          const startAngle = Math.atan2(t.startY - cy, t.startX - cx);
          const angle = Math.atan2(py - cy, px - cx);
          const deg =
            t.startRotation + ((angle - startAngle) * 180) / Math.PI;
          onRotate(t.id, Math.round(deg) % 360);
        }
        return;
      }

      if (!drag.current) return;
      const rawX =
        ((event.clientX - rect.left) / rect.width) * 100 - drag.current.offsetX;
      const y =
        ((event.clientY - rect.top) / rect.height) * 100 - drag.current.offsetY;
      const piece = pieces.find((p) => p.id === drag.current!.id);
      const size = FIT_BASE_SIZE * (piece?.scale ?? 1);
      const rawCx = rawX + size / 2;
      const snappedCx = snapCenterX(rawCx);
      const snapped = snappedCx === FIT_CENTER_X;
      setShowCenterGuide(snapped);
      const x = snapped ? snappedCx - size / 2 : rawX;
      onMove(
        drag.current.id,
        Math.min(85, Math.max(0, x)),
        Math.min(85, Math.max(0, y)),
      );
    },
    [onMove, onRotate, onScale, pieces],
  );

  const onPointerUp = useCallback(() => {
    drag.current = null;
    transform.current = null;
    setShowCenterGuide(false);
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  function startDrag(event: ReactPointerEvent, piece: FitPiece) {
    if (!ref.current) return;
    event.preventDefault();
    const rect = ref.current.getBoundingClientRect();
    const pointerX = ((event.clientX - rect.left) / rect.width) * 100;
    const pointerY = ((event.clientY - rect.top) / rect.height) * 100;
    drag.current = {
      id: piece.id,
      offsetX: pointerX - piece.x,
      offsetY: pointerY - piece.y,
    };
    setSelectedId(piece.id);
    onSelect(piece.id);
  }

  function startTransform(
    event: ReactPointerEvent,
    piece: FitPiece,
    mode: "scale" | "rotate",
  ) {
    if (!ref.current || !freeTransform) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = ref.current.getBoundingClientRect();
    transform.current = {
      id: piece.id,
      mode,
      startX: event.clientX - rect.left,
      startY: event.clientY - rect.top,
      startScale: piece.scale,
      startRotation: piece.rotation ?? 0,
    };
    setSelectedId(piece.id);
    onSelect(piece.id);
  }

  const selected = pieces.find((p) => p.id === selectedId) ?? null;
  const selectedRotation = selected?.rotation ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
          Fit board
        </p>
        <button
          type="button"
          onClick={() => setWhitePreview((v) => !v)}
          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
            whitePreview
              ? "border-dash-accent/50 bg-white text-dash-bg"
              : "border-dash-border text-dash-muted hover:bg-dash-elevated"
          }`}
        >
          {whitePreview ? "White preview on" : "Preview white bg"}
        </button>
      </div>
      <div
        ref={ref}
        className={`relative aspect-square w-full overflow-hidden rounded-2xl border border-dash-border ${
          white ? "bg-white" : "bg-[#0d1018]"
        }`}
        style={
          white
            ? undefined
            : {
                backgroundImage:
                  "radial-gradient(circle at 50% 0%, rgba(212,160,23,0.08), transparent 55%), linear-gradient(to right, rgba(42,49,66,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(42,49,66,0.35) 1px, transparent 1px)",
                backgroundSize: "auto, 40px 40px, 40px 40px",
              }
        }
      >
        {showCenterGuide ? (
          <div
            data-fit-guide="1"
            className="pointer-events-none absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-dash-accent/70"
            aria-hidden
          />
        ) : null}
        {pieces.length === 0 ? (
          <p
            className={`absolute inset-0 flex items-center justify-center px-6 text-center text-sm ${
              white ? "text-neutral-400" : "text-dash-faint"
            }`}
          >
            Tap closet pieces to drop them here, then Auto arrange or drag free.
          </p>
        ) : null}
        {pieces.map((piece) => {
          const item = byId.get(piece.closetItemId);
          if (!item) return null;
          const size = FIT_BASE_SIZE * piece.scale;
          const active = !forceWhite && selectedId === piece.id;
          const rotation = piece.rotation ?? 0;
          const src = item.cutoutImage || item.image;
          return (
            <div
              key={piece.id}
              data-fit-piece="1"
              data-rotation={String(rotation)}
              className={`absolute touch-none select-none ${
                active ? "z-50" : ""
              }`}
              style={{
                left: `${piece.x}%`,
                top: `${piece.y}%`,
                width: `${size}%`,
                zIndex: active ? 999 : piece.zIndex,
              }}
            >
              <button
                type="button"
                onPointerDown={(e) => startDrag(e, piece)}
                className={`relative block w-full bg-transparent ${
                  active ? "ring-2 ring-dash-accent/80 ring-offset-0" : ""
                }`}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  cursor: "grab",
                }}
                aria-label={item.name}
              >
                <span className="relative block aspect-square w-full overflow-visible bg-transparent">
                  <ClosetImage src={src} alt={item.name} />
                </span>
              </button>
              {active && freeTransform ? (
                <>
                  <button
                    type="button"
                    data-fit-chrome="1"
                    aria-label="Scale"
                    onPointerDown={(e) => startTransform(e, piece, "scale")}
                    className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full border-2 border-dash-bg bg-dash-accent shadow"
                    style={{ cursor: "nwse-resize" }}
                  />
                  <button
                    type="button"
                    data-fit-chrome="1"
                    aria-label="Rotate"
                    onPointerDown={(e) => startTransform(e, piece, "rotate")}
                    className="absolute -top-3 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-dash-bg bg-dash-text shadow"
                    style={{ cursor: "grab" }}
                  />
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      {selected && byId.get(selected.closetItemId) ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dash-border bg-dash-panel px-3 py-2 text-sm">
          <span className="mr-auto truncate text-dash-muted">
            {byId.get(selected.closetItemId)?.name}
          </span>
          <button
            type="button"
            className="rounded-lg border border-dash-border px-2.5 py-1 text-xs hover:bg-dash-elevated"
            onClick={() =>
              onScale(selected.id, Math.max(0.45, selected.scale - 0.15))
            }
          >
            Smaller
          </button>
          <button
            type="button"
            className="rounded-lg border border-dash-border px-2.5 py-1 text-xs hover:bg-dash-elevated"
            onClick={() =>
              onScale(selected.id, Math.min(1.8, selected.scale + 0.15))
            }
          >
            Bigger
          </button>
          <button
            type="button"
            className="rounded-lg border border-dash-border px-2.5 py-1 text-xs hover:bg-dash-elevated"
            onClick={() => onRotate(selected.id, selectedRotation - 15)}
          >
            ↺ 15°
          </button>
          <button
            type="button"
            className="rounded-lg border border-dash-border px-2.5 py-1 text-xs hover:bg-dash-elevated"
            onClick={() => onRotate(selected.id, selectedRotation + 15)}
          >
            ↻ 15°
          </button>
          <button
            type="button"
            className="rounded-lg border border-dash-border px-2.5 py-1 text-xs hover:bg-dash-elevated"
            onClick={() => onRotate(selected.id, 0)}
          >
            Reset angle
          </button>
          <button
            type="button"
            className="rounded-lg border border-dash-border px-2.5 py-1 text-xs text-dash-down hover:bg-dash-elevated"
            onClick={() => {
              onRemove(selected.id);
              setSelectedId(null);
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <p className="text-xs text-dash-faint">
          Select a piece to drag, scale, rotate, or remove.
          {freeTransform
            ? " Gold handle = scale · white handle = rotate."
            : ""}
        </p>
      )}
    </div>
  );
}
