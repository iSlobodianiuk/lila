export function PlayerToken({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  return (
    <span
      aria-label="Фішка гравця"
      className={`${dim} relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-rose-300 to-rose-400 shadow-[0_4px_14px_rgba(244,114,114,0.45)] ring-2 ring-white/70`}
    >
      <span className="absolute inset-0 rounded-full bg-white/30 blur-[1px]" />
      <span className="relative h-1.5 w-1.5 rounded-full bg-white/90" />
    </span>
  );
}
