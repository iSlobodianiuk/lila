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
        "group relative aspect-square select-none rounded-xl border backdrop-blur-sm transition-all duration-500 sm:rounded-2xl",
        "flex flex-col items-center justify-center gap-0.5 px-1 py-1 text-center sm:gap-1 sm:px-1.5 sm:py-1.5",
        isActive
          ? "z-[1] scale-[1.04] border-amber-400/80 bg-white/25 shadow-[0_8px_28px_-8px_rgba(212,165,116,0.45)] ring-2 ring-amber-400/70"
          : "border-white/20 bg-white/15 hover:bg-white/25",
        isGoal && !isActive
          ? "border-amber-300/50 bg-gradient-to-br from-amber-400/25 to-amber-600/15"
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
        <span className="absolute left-1.5 top-1 font-mono text-[10px] tracking-tight text-white/40">
          {cell.id}
        </span>

        {isGoal && (
          <span
            aria-hidden
            className="absolute right-1.5 top-1 text-[10px] text-amber-200"
            title="Ціль гри"
          >
            ★
          </span>
        )}
        {isEntry && (
          <span
            aria-hidden
            className="absolute right-1.5 top-1 text-[10px] text-rose-200"
            title="Клітинка входу (6)"
          >
            ◉
          </span>
        )}
        {hasArrow && (
          <span
            aria-hidden
            className="absolute left-1 bottom-1 rounded-full bg-emerald-500/35 px-1 py-0.5 text-[8px] font-semibold leading-none text-emerald-100 sm:left-1.5 sm:px-1.5 sm:text-[9px]"
            title={`Стріла до клітинки ${cell.arrowTo}`}
          >
            ↑ {cell.arrowTo}
          </span>
        )}
        {hasSnake && (
          <span
            aria-hidden
            className="absolute right-1 bottom-1 rounded-full bg-rose-500/35 px-1 py-0.5 text-[8px] font-semibold leading-none text-rose-100 sm:right-1.5 sm:px-1.5 sm:text-[9px]"
            title={`Змія до клітинки ${cell.snakeTo}`}
          >
            ↓ {cell.snakeTo}
          </span>
        )}

        <span className="mt-2 line-clamp-1 text-[9px] font-medium leading-tight text-white/90 sm:mt-2.5 sm:text-[11px] sm:line-clamp-2">
          {cell.name}
        </span>
        <span className="hidden text-[9px] font-light italic leading-none text-white/50 md:block">
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
