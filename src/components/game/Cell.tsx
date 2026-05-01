"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Cell as BoardCellType } from "@/lib/types";
import { GOAL_CELL } from "@/lib/board-data";
import { PlayerToken } from "@/components/player-token";

type Props = {
  cell: BoardCellType;
  isActive: boolean;
};

type TooltipPos = {
  left: number;
  top: number;
};

function CellTooltipPortal({
  anchorEl,
  visible,
  cell,
}: {
  anchorEl: HTMLElement | null;
  visible: boolean;
  cell: BoardCellType;
}) {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<TooltipPos>({ left: 0, top: 0 });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!visible || !anchorEl) return;

    const update = () => {
      const rect = anchorEl.getBoundingClientRect();
      const tooltipWidth = 260;
      const margin = 12;
      const left = Math.min(
        window.innerWidth - tooltipWidth - margin,
        Math.max(margin, rect.left + rect.width / 2 - tooltipWidth / 2),
      );
      const top = Math.max(margin, rect.top - 10);
      setPos({ left, top });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [visible, anchorEl]);

  if (!mounted || !visible || !anchorEl) return null;

  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[1000] w-[260px] -translate-y-full rounded-xl bg-stone-900/95 px-3 py-2 text-left text-[11px] leading-snug text-stone-100 shadow-2xl backdrop-blur-md"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="font-semibold text-amber-200">
        {cell.id}. {cell.name}
      </div>
      <div className="mt-0.5 text-[10px] italic text-stone-300">{cell.original}</div>
      <div className="mt-1 text-stone-200/90">{cell.description}</div>
      {cell.arrowTo != null && (
        <div className="mt-1 text-[10px] font-medium text-emerald-300">Стріла до: {cell.arrowTo}</div>
      )}
      {cell.snakeTo != null && (
        <div className="mt-1 text-[10px] font-medium text-rose-300">Змія до: {cell.snakeTo}</div>
      )}
    </div>,
    document.body,
  );
}

function CellBase({ cell, isActive }: Props) {
  const isGoal = cell.id === GOAL_CELL;
  const isEntry = cell.id === 6;
  const hasArrow = cell.arrowTo != null;
  const hasSnake = cell.snakeTo != null;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const cellClass = useMemo(
    () =>
      [
        "group relative h-full w-full select-none rounded-xl border transition-all duration-300 sm:rounded-2xl",
        "flex flex-col items-center justify-center gap-0.5 px-1 py-1 text-center sm:gap-1 sm:px-1.5 sm:py-1.5",
        isActive
          ? "z-[3] scale-[1.04] border-amber-300/85 bg-white/30 shadow-[0_10px_28px_-10px_rgba(212,165,116,0.55)] ring-2 ring-amber-300/75"
          : "z-[2] border-white/35 bg-white/16 shadow-[0_8px_24px_-14px_rgba(12,24,42,0.45)] hover:border-white/45 hover:bg-white/24",
        isGoal && !isActive
          ? "border-amber-300/70 bg-gradient-to-br from-amber-300/40 to-amber-500/22"
          : "",
      ].join(" "),
    [isActive, isGoal],
  );

  return (
    <>
      <div
        ref={rootRef}
        data-cell-id={cell.id}
        className={cellClass}
        onMouseEnter={() => setTooltipOpen(true)}
        onMouseLeave={() => setTooltipOpen(false)}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-black/22 via-black/18 to-black/28"
        />

        <span className="absolute left-1.5 top-1 z-[1] font-mono text-[10px] tracking-tight text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {cell.id}
        </span>

        {isGoal && (
          <span
            aria-hidden
            className="absolute right-1.5 top-1 z-[1] text-[10px] text-amber-100/95 drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]"
            title="Ціль гри"
          >
            ★
          </span>
        )}
        {isEntry && (
          <span
            aria-hidden
            className="absolute right-1.5 top-1 z-[1] text-[10px] text-rose-100/95 drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]"
            title="Клітинка входу (6)"
          >
            ◉
          </span>
        )}
        {hasArrow && (
          <span
            aria-hidden
            className="absolute left-1 bottom-1 z-[1] rounded-full border border-emerald-200/35 bg-emerald-500/45 px-1 py-0.5 text-[8px] font-semibold leading-none text-emerald-50 shadow-[0_2px_6px_-3px_rgba(0,0,0,0.5)] sm:left-1.5 sm:px-1.5 sm:text-[9px]"
            title={`Стріла до клітинки ${cell.arrowTo}`}
          >
            ↑ {cell.arrowTo}
          </span>
        )}
        {hasSnake && (
          <span
            aria-hidden
            className="absolute right-1 bottom-1 z-[1] rounded-full border border-rose-200/35 bg-rose-500/45 px-1 py-0.5 text-[8px] font-semibold leading-none text-rose-50 shadow-[0_2px_6px_-3px_rgba(0,0,0,0.5)] sm:right-1.5 sm:px-1.5 sm:text-[9px]"
            title={`Змія до клітинки ${cell.snakeTo}`}
          >
            ↓ {cell.snakeTo}
          </span>
        )}

        <span className="relative z-[1] mt-1.5 line-clamp-2 px-1 text-[10px] font-semibold leading-[1.2] text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.85)] sm:text-[11px] md:text-[12px]">
          {cell.name}
        </span>
        <span className="relative z-[1] hidden px-1 text-[9px] italic leading-none text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] md:block">
          {cell.original}
        </span>

        {isActive && (
          <span className="mt-1">
            <PlayerToken size="sm" />
          </span>
        )}
      </div>
      <CellTooltipPortal anchorEl={rootRef.current} visible={tooltipOpen} cell={cell} />
    </>
  );
}

export const Cell = memo(
  CellBase,
  (prev, next) => prev.isActive === next.isActive && prev.cell === next.cell,
);
