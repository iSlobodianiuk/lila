"use client";

const DOTS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function DiceFace({ value }: { value: number }) {
  const dots = DOTS[value] ?? DOTS[1];
  return (
    <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-1.5 p-3">
      {Array.from({ length: 9 }).map((_, idx) => {
        const row = Math.floor(idx / 3);
        const col = idx % 3;
        const has = dots.some(([r, c]) => r === row && c === col);
        return (
          <div
            key={idx}
            className={
              has
                ? "rounded-full bg-stone-600 shadow-inner"
                : ""
            }
          />
        );
      })}
    </div>
  );
}

type Props = {
  value: number | null;
  isRolling: boolean;
  onRoll: () => void;
  label: string;
  hint?: string;
  disabled?: boolean;
};

export function Dice({ value, isRolling, onRoll, label, hint, disabled }: Props) {
  const display = value ?? 6;
  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4">
      <button
        type="button"
        onClick={onRoll}
        disabled={disabled || isRolling}
        aria-label="Кинути кубик"
        className={[
          "relative h-20 w-20 rounded-xl border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-stone-100 sm:h-24 sm:w-24",
          "shadow-[0_8px_24px_-8px_rgba(92,74,54,0.35)] transition-all duration-300",
          "hover:scale-[1.03] hover:shadow-[0_12px_32px_-8px_rgba(92,74,54,0.45)] hover:border-stone-300",
          "disabled:cursor-not-allowed disabled:opacity-80",
          isRolling ? "animate-dice-roll" : "",
        ].join(" ")}
      >
        <DiceFace value={display} />
      </button>
      <button
        type="button"
        onClick={onRoll}
        disabled={disabled || isRolling}
        className={[
          "min-h-10 rounded-xl px-5 py-2.5 text-xs font-medium tracking-wide shadow-md transition-all sm:px-6 sm:text-sm",
          "bg-gradient-to-br from-stone-700 to-stone-800 text-stone-50",
          "hover:from-stone-800 hover:to-stone-900 hover:shadow-lg",
          "disabled:cursor-not-allowed disabled:opacity-60",
        ].join(" ")}
      >
        {isRolling ? "Кидаємо…" : label}
      </button>
      {hint && (
        <p className="max-w-[14rem] text-center text-[11px] leading-relaxed text-stone-500 sm:text-xs">
          {hint}
        </p>
      )}
    </div>
  );
}
