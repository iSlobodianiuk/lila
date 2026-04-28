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
      const tooltipWidth = 280;
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
      className="pointer-events-none fixed z-[1000] w-[280px] -translate-y-full rounded-xl bg-stone-800/95 px-4 py-3 text-left shadow-2xl backdrop-blur-md border border-stone-700/50"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="font-semibold text-amber-100 text-sm">
        {cell.id}. {cell.name}
      </div>
      <div className="mt-1 text-xs italic text-stone-400 font-serif">{cell.original}</div>
      {cell.description && (
        <div className="mt-2 text-xs leading-relaxed text-stone-200/90">{cell.description}</div>
      )}
      {cell.arrowTo != null && (
        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-400">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          Стріла до клітинки {cell.arrowTo}
        </div>
      )}
      {cell.snakeTo != null && (
        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-rose-400">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />
          Змія до клітинки {cell.snakeTo}
        </div>
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
        "group relative aspect-square select-none rounded-lg sm:rounded-xl transition-all duration-300",
        "flex flex-col items-center justify-center gap-0.5 px-1 py-1 text-center sm:gap-1 sm:px-1.5 sm:py-1.5",
        // Base styling
        "bg-gradient-to-br from-[#fffdfb] to-[#faf6f0] border border-stone-200/60",
        // Hover state
        "hover:border-stone-300 hover:shadow-md hover:from-[#fffef9] hover:to-[#fdf8f2]",
        // Active state
        isActive
          ? "z-[1] scale-[1.04] border-amber-500/70 from-amber-50 to-amber-100/50 shadow-[0_0_0_3px_rgba(217,119,6,0.2),0_8px_24px_-8px_rgba(217,119,6,0.3)] ring-2 ring-amber-400/50 animate-pulse-glow"
          : "",
        // Goal cell
        isGoal && !isActive
          ? "border-amber-400/60 from-amber-50 to-yellow-50 shadow-sm"
          : "",
        // Arrow cell indicator
        hasArrow && !isActive
          ? "border-emerald-300/50"
          : "",
        // Snake cell indicator
        hasSnake && !isActive
          ? "border-rose-300/50"
          : "",
      ].join(" "),
    [isActive, isGoal, hasArrow, hasSnake],
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
        {/* Cell number */}
        <span className="absolute left-1 top-0.5 font-mono text-[9px] sm:text-[10px] font-semibold text-stone-400">
          {cell.id}
        </span>

        {/* Goal indicator */}
        {isGoal && (
          <span
            aria-hidden
            className="absolute right-1 top-0.5 text-[10px] sm:text-xs text-amber-500"
            title="Ціль гри"
          >
            ★
          </span>
        )}
        
        {/* Entry cell indicator */}
        {isEntry && (
          <span
            aria-hidden
            className="absolute right-1 top-0.5 text-[9px] sm:text-[10px] text-rose-400"
            title="Клітинка входу (6)"
          >
            ◉
          </span>
        )}
        
        {/* Arrow indicator */}
        {hasArrow && (
          <span
            aria-hidden
            className="absolute left-0.5 bottom-0.5 sm:left-1 sm:bottom-1 flex items-center gap-0.5 rounded-full bg-emerald-500/20 px-1 py-0.5 text-[7px] sm:text-[8px] font-semibold leading-none text-emerald-700"
            title={`Стріла до клітинки ${cell.arrowTo}`}
          >
            ↑{cell.arrowTo}
          </span>
        )}
        
        {/* Snake indicator */}
        {hasSnake && (
          <span
            aria-hidden
            className="absolute right-0.5 bottom-0.5 sm:right-1 sm:bottom-1 flex items-center gap-0.5 rounded-full bg-rose-500/20 px-1 py-0.5 text-[7px] sm:text-[8px] font-semibold leading-none text-rose-700"
            title={`Змія до клітинки ${cell.snakeTo}`}
          >
            ↓{cell.snakeTo}
          </span>
        )}

        {/* Ukrainian name */}
        <span className="mt-2 line-clamp-1 text-[8px] sm:text-[10px] font-medium leading-tight text-stone-700 sm:line-clamp-2">
          {cell.name}
        </span>
        
        {/* Sanskrit name */}
        <span className="hidden text-[8px] sm:text-[9px] font-serif italic leading-none text-stone-400 md:block">
          {cell.original}
        </span>

        {/* Player token */}
        {isActive && (
          <span className="mt-0.5 sm:mt-1 animate-subtle-float">
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
