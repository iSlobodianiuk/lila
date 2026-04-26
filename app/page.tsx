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
          Лила · Leela
        </span>
        <h1 className="font-display text-2xl text-stone-800 sm:text-4xl">
          Гра Самопізнання
        </h1>
        <p className="max-w-md text-xs leading-relaxed text-stone-500 sm:text-sm">
          72 клітинки — 72 стани свідомості. Кидайте кубик, щоб увійти у гру через
          народження (шістку), і прокладіть шлях до Космічної свідомості.
        </p>
      </header>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <GameBoard position={state.position} />
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
