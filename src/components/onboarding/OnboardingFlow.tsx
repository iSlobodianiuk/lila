"use client";

import { useMemo, useState } from "react";

type Props = {
  onComplete: () => void;
};

const steps = [
  {
    title: "Що таке гра Ліла",
    text: "Ліла — це гра самопізнання, у якій важливо не просто зайти в процес, а зробити це з ясним і чесним запитом. Перед початком гри ти сформулюєш свій намір і пройдеш короткий діалог із провідником.",
    visual: "board",
  },
  {
    title: "Як відбувається вхід у гру",
    text: "Спочатку ти формулюєш свій запит. Потім провідник допомагає його уточнити через короткий діалог. Після цього ти кидаєш кубик. Щоб увійти в гру, має випасти 6.",
    note: "Якщо випадає не 6 — це не помилка. Це означає, що запит ще можна уточнити або підсилити.",
    visual: "flow",
  },
  {
    title: "Що потрібно від тебе",
    text: "Сформулюй запит максимально чесно і просто. Відповідай на питання провідника по суті. Якщо кубик ще не дав 6 — не поспішай, а дозволь запиту стати точнішим.",
    visual: "focus",
  },
] as const;

export function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const current = steps[step];

  const progressLabel = useMemo(() => `${step + 1} із ${steps.length}`, [step]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-3xl rounded-3xl border border-white/50 bg-white/75 p-5 shadow-[0_30px_70px_-35px_rgba(72,54,28,0.45)] backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">Онбординг</p>
          <p className="text-sm font-medium text-stone-600">{progressLabel}</p>
        </div>

        <div className="mb-5 flex gap-2">
          {steps.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full transition ${
                index <= step ? "bg-stone-800" : "bg-stone-200"
              }`}
            />
          ))}
        </div>

        <div className="grid gap-5 rounded-2xl border border-stone-200/60 bg-white/70 p-4 sm:p-5">
          <div className="space-y-3">
            <h2 className="font-display text-3xl leading-tight text-stone-900">{current.title}</h2>
            <p className="text-sm leading-relaxed text-stone-700 sm:text-base">{current.text}</p>
            {"note" in current && current.note ? (
              <p className="rounded-xl border border-amber-200/70 bg-amber-50/70 px-3 py-2 text-sm text-amber-900">
                {current.note}
              </p>
            ) : null}
          </div>

          {current.visual === "board" && (
            <div className="rounded-2xl border border-stone-200/70 bg-[#10384a] p-3">
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 32 }).map((_, index) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    className="aspect-square rounded-md border border-white/30 bg-white/20"
                  />
                ))}
              </div>
            </div>
          )}

          {current.visual === "flow" && (
            <div className="grid gap-2 rounded-2xl border border-stone-200/70 bg-stone-50/80 p-3 sm:grid-cols-4 sm:items-center">
              {["Запит", "Діалог", "Кубик", "Вхід у гру"].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-stone-700 sm:justify-center"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {current.visual === "focus" && (
            <div className="rounded-2xl border border-stone-200/70 bg-stone-50/80 p-4 text-sm leading-relaxed text-stone-700">
              Вхід у гру відбувається поступово: чесний намір, короткий діалог із провідником і уважне
              доуточнення запиту перед переходом на поле.
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(0, prev - 1))}
            disabled={step === 0}
            className="min-h-10 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Назад
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => Math.min(steps.length - 1, prev + 1))}
              className="min-h-10 rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-800"
            >
              Далі
            </button>
          ) : (
            <button
              type="button"
              onClick={onComplete}
              className="min-h-10 rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-800"
            >
              Почати
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
