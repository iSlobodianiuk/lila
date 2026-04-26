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
                ? "rounded-full bg-stone-700 shadow-inner"
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
    <div className="flex flex-col items-center gap-2.5 sm:gap-3">
      <button
        type="button"
        onClick={onRoll}
        disabled={disabled || isRolling}
        aria-label="Кинути кубик"
        className={[
          "relative h-20 w-20 rounded-2xl border border-white/60 bg-gradient-to-br from-white to-stone-50 sm:h-24 sm:w-24",
          "shadow-[0_12px_30px_-10px_rgba(120,90,60,0.45)] transition-all duration-300",
          "hover:scale-[1.03] hover:shadow-[0_16px_36px_-10px_rgba(120,90,60,0.55)]",
          "disabled:cursor-not-allowed disabled:opacity-90",
          isRolling ? "animate-dice-roll" : "",
        ].join(" ")}
      >
        <DiceFace value={display} />
      </button>
      <button
        type="button"
        onClick={onRoll}
        disabled={disabled || isRolling}
        className="min-h-10 rounded-full bg-stone-900/90 px-4 py-2 text-xs font-medium tracking-wide text-stone-50 shadow-md transition hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:text-sm"
      >
        {isRolling ? "Кидаємо…" : label}
      </button>
      {hint && (
        <p className="max-w-[14rem] text-center text-[11px] leading-snug text-stone-500 sm:text-xs">
          {hint}
        </p>
      )}
    </div>
  );
}
