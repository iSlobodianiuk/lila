import { BOARD_GRID } from "@/lib/board-layout";
import { Cell } from "./Cell";

type Props = {
  position: number;
};

export function GameBoard({ position }: Props) {
  return (
    <div className="rounded-3xl border border-white/40 bg-white/40 p-3 shadow-[0_24px_60px_-30px_rgba(120,90,60,0.35)] backdrop-blur-xl sm:p-5">
      <div className="grid grid-cols-9 gap-1.5 sm:gap-2">
        {BOARD_GRID.flat().map((cell) => (
          <Cell key={cell.id} cell={cell} isActive={cell.id === position} />
        ))}
      </div>
    </div>
  );
}
