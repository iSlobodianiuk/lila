"use client";

import { signIn } from "next-auth/react";

export function PreAuthHero() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6">
      <section className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/50 bg-white/70 p-6 shadow-[0_30px_70px_-35px_rgba(72,54,28,0.45)] backdrop-blur-xl sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
        >
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-200/70 blur-3xl" />
          <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-indigo-200/60 blur-3xl" />
        </div>

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-4 text-center lg:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
              Ліла онлайн
            </p>
            <h1 className="font-display text-4xl leading-tight text-stone-900 sm:text-5xl">
              Гра Ліла онлайн
            </h1>
            <p className="text-sm leading-relaxed text-stone-700 sm:text-base">
              Сформулюй свій запит, увійди в діалог із провідником і розпочни гру усвідомлено
            </p>
            <p className="text-sm leading-relaxed text-stone-600">
              Цей простір допоможе тобі точніше побачити свій запит перед входом у гру. Спочатку ти
              сформулюєш намір, далі — провідник поставить уточнюючі питання, а кубик покаже, чи готова ти
              увійти в гру.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="min-h-11 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-800"
              >
                Увійти через Google
              </button>
              <p className="text-xs text-stone-500">
                Після входу ти побачиш коротке пояснення правил і зможеш одразу почати
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xs rounded-2xl border border-white/60 bg-white/75 p-4 shadow-[0_20px_40px_-26px_rgba(30,24,15,0.45)]">
            <p className="mb-3 text-center text-xs font-medium tracking-wide text-stone-500">
              Прев&apos;ю поля
            </p>
            <div className="grid grid-cols-6 gap-1.5 rounded-xl bg-[#0f3243] p-3">
              {Array.from({ length: 36 }).map((_, index) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  className="aspect-square rounded-md border border-white/30 bg-white/20 backdrop-blur-[1px]"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
