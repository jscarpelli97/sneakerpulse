"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ClosetImage } from "@/components/wardrobe/ClosetImage";
import {
  newFitId,
  newFitPieceId,
} from "@/lib/portfolio/vault";
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
  onFlash,
}: {
  closet: ClosetItem[];
  fits: FitBoard[];
  onChange: (next: FitBoard[]) => void;
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
            Arrange closet pieces on a board — Freeform energy, saved to your
            account.
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
  onDelete,
  onFlash,
}: {
  board: FitBoard;
  closet: ClosetItem[];
  onChange: (patch: Partial<FitBoard>) => void;
  onDelete: () => void;
  onFlash: (message: string) => void;
}) {
  const [closetQuery, setClosetQuery] = useState("");
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
        {missing ? (
          <p className="text-xs text-dash-down">
            {missing} piece{missing === 1 ? "" : "s"} missing from closet
            (removed items stay off the board).
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
        <FitCanvas
          pieces={board.pieces}
          byId={byId}
          onMove={(id, x, y) => patchPiece(id, { x, y })}
          onSelect={bringFront}
          onScale={(id, scale) => patchPiece(id, { scale })}
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
  pieces,
  byId,
  onMove,
  onSelect,
  onScale,
  onRemove,
}: {
  pieces: FitPiece[];
  byId: Map<string, ClosetItem>;
  onMove: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
  onScale: (id: string, scale: number) => void;
  onRemove: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const drag = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!drag.current || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x =
        ((event.clientX - rect.left) / rect.width) * 100 - drag.current.offsetX;
      const y =
        ((event.clientY - rect.top) / rect.height) * 100 - drag.current.offsetY;
      onMove(
        drag.current.id,
        Math.min(85, Math.max(0, x)),
        Math.min(85, Math.max(0, y)),
      );
    },
    [onMove],
  );

  const onPointerUp = useCallback(() => {
    drag.current = null;
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

  const selected = pieces.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="space-y-3">
      <div
        ref={ref}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-dash-border bg-[#0d1018] sm:aspect-[3/4]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(212,160,23,0.08), transparent 55%), linear-gradient(to right, rgba(42,49,66,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(42,49,66,0.35) 1px, transparent 1px)",
          backgroundSize: "auto, 40px 40px, 40px 40px",
        }}
      >
        {pieces.length === 0 ? (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-dash-faint">
            Tap closet pieces to drop them here, then drag to arrange.
          </p>
        ) : null}
        {pieces.map((piece) => {
          const item = byId.get(piece.closetItemId);
          if (!item) return null;
          const size = 28 * piece.scale;
          const active = selectedId === piece.id;
          return (
            <button
              key={piece.id}
              type="button"
              onPointerDown={(e) => startDrag(e, piece)}
              className={`absolute touch-none select-none ${
                active ? "ring-2 ring-dash-accent" : ""
              }`}
              style={{
                left: `${piece.x}%`,
                top: `${piece.y}%`,
                width: `${size}%`,
                zIndex: piece.zIndex,
                cursor: "grab",
              }}
              aria-label={item.name}
            >
              <span className="relative block aspect-square w-full overflow-hidden rounded-xl bg-dash-panel/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
                <ClosetImage src={item.image} alt={item.name} />
              </span>
            </button>
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
              onScale(selected.id, Math.max(0.55, selected.scale - 0.15))
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
          Select a piece on the board to resize or remove it.
        </p>
      )}
    </div>
  );
}
