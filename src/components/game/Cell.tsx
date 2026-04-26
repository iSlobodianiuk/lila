import type { Cell as BoardCellType } from "@/lib/types";
import { GOAL_CELL } from "@/lib/board-data";
import { PlayerToken } from "@/components/player-token";

type Props = {
  cell: BoardCellType;
  isActive: boolean;
};

export function Cell({ cell, isActive }: Props) {
  const isGoal = cell.id === GOAL_CELL;
  const isEntry = cell.id === 6;
  const hasArrow = cell.arrowTo != null;
  const hasSnake = cell.snakeTo != null;

  return (
    <div
      className={[
        "group relative aspect-square rounded-xl border backdrop-blur-md transition-all duration-500 sm:rounded-2xl",
        "flex flex-col items-center justify-center gap-0.5 px-1 py-1 text-center sm:gap-1 sm:px-1.5 sm:py-1.5",
        isActive
          ? "border-amber-400/70 bg-white/85 shadow-[0_8px_28px_-8px_rgba(212,165,116,0.55)] ring-2 ring-amber-400/60 scale-[1.04]"
          : "border-white/40 bg-white/55 hover:bg-white/75 hover:border-white/70",
        isGoal && !isActive
          ? "border-amber-300/60 bg-gradient-to-br from-amber-50/80 to-rose-50/80"
          : "",
      ].join(" ")}
    >
      <span className="absolute left-1.5 top-1 font-mono text-[10px] tracking-tight text-stone-400">
        {cell.id}
      </span>

      {isGoal && (
        <span
          aria-hidden
          className="absolute right-1.5 top-1 text-[10px] text-amber-500"
          title="Ціль гри"
        >
          ★
        </span>
      )}
      {isEntry && (
        <span
          aria-hidden
          className="absolute right-1.5 top-1 text-[10px] text-rose-400"
          title="Клітинка входу (6)"
        >
          ◉
        </span>
      )}
      {hasArrow && (
        <span
          aria-hidden
          className="absolute left-1 bottom-1 rounded-full bg-emerald-100 px-1 py-0.5 text-[8px] font-semibold leading-none text-emerald-700 sm:left-1.5 sm:px-1.5 sm:text-[9px]"
          title={`Стріла до клітинки ${cell.arrowTo}`}
        >
          ↑ {cell.arrowTo}
        </span>
      )}
      {hasSnake && (
        <span
          aria-hidden
          className="absolute right-1 bottom-1 rounded-full bg-rose-100 px-1 py-0.5 text-[8px] font-semibold leading-none text-rose-700 sm:right-1.5 sm:px-1.5 sm:text-[9px]"
          title={`Змія до клітинки ${cell.snakeTo}`}
        >
          ↓ {cell.snakeTo}
        </span>
      )}

      <span className="mt-2 text-[9px] leading-tight font-medium text-stone-700 line-clamp-1 sm:mt-2.5 sm:text-[11px] sm:line-clamp-2">
        {cell.name}
      </span>
      <span className="hidden md:block text-[9px] font-light italic text-stone-400/90 leading-none">
        {cell.original}
      </span>

      {isActive && (
        <span className="mt-1">
          <PlayerToken size="sm" />
        </span>
      )}

      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 hidden w-48 -translate-x-1/2 rounded-xl bg-stone-900/90 px-3 py-2 text-left text-[11px] leading-snug text-stone-100 shadow-xl backdrop-blur-md md:group-hover:block"
      >
        <div className="font-semibold text-amber-200">
          {cell.id}. {cell.name}
        </div>
        <div className="mt-0.5 text-[10px] italic text-stone-300">{cell.original}</div>
        <div className="mt-1 text-stone-200/90">{cell.description}</div>
        {hasArrow && (
          <div className="mt-1 text-[10px] font-medium text-emerald-300">
            Стріла до: {cell.arrowTo}
          </div>
        )}
        {hasSnake && (
          <div className="mt-1 text-[10px] font-medium text-rose-300">
            Змія до: {cell.snakeTo}
          </div>
        )}
      </div>
    </div>
  );
}
