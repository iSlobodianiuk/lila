"use client";

import { GameBoard } from "@/src/components/game/GameBoard";
import { GamePanel } from "@/src/components/game/GamePanel";
import { useLeelaGame } from "@/hooks/use-leela-game";

export default function Home() {
  const { state, rollDice, reset, setPlayerQuery } = useLeelaGame();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-3 py-6 sm:gap-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="text-[11px] font-medium uppercase tracking-[0.32em] text-stone-500">
          ЛІЛА · LEELA
        </span>
        <h1 className="font-display text-2xl text-stone-800 sm:text-4xl">
          Гра Самопізнання
        </h1>
        <p className="max-w-[min(100%,42rem)] overflow-x-auto whitespace-nowrap text-xs text-stone-500 sm:text-sm">
          Настільна гра для самопізнання та розвитку через усвідомлені рішення
        </p>
      </header>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 max-h-[80vh] w-full overflow-auto">
          <GameBoard position={state.position} />
        </div>
        <GamePanel
          state={state}
          onRoll={rollDice}
          onReset={reset}
          onQueryChange={setPlayerQuery}
        />
      </div>

      <footer className="pb-1 text-center text-[10px] tracking-wide text-stone-400 sm:pb-2 sm:text-[11px]">
        Базується на канонічній дошці 72 клітинок Гариша Джогарі.
      </footer>
    </main>
  );
}
