/** Kind of OpenAI completion used in Leela. Each has env override + dev/prod defaults. */

export type LeelaMaxTokensKind = "guide" | "entry" | "cell" | "complete";

/** Dev-oriented caps (розробка / тести — менші стелі для економії й швидшого відлову “розгону”). */
const DEV_DEFAULTS: Record<LeelaMaxTokensKind, number> = {
  guide: 80,
  entry: 150,
  cell: 190,
  complete: 450,
};

/** Prod стелі — нижчі за попередні максимуми, з запасом під підсумок гри. */
const PROD_DEFAULTS: Record<LeelaMaxTokensKind, number> = {
  guide: 100,
  entry: 350,
  cell: 400,
  complete: 800,
};

const ENV_KEYS: Record<LeelaMaxTokensKind, string> = {
  guide: "LEELA_MAX_TOKENS_GUIDE",
  entry: "LEELA_MAX_TOKENS_ENTRY",
  cell: "LEELA_MAX_TOKENS_CELL",
  complete: "LEELA_MAX_TOKENS_COMPLETE",
};

function parsePositiveInt(raw: string | undefined): number | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return n;
}

/** Чи це режим розробки (локальний `next dev`). */
export function isLeelaAiDevMode(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Ліміт maxOutputTokens для зазначеного кейсу.
 * Перевизначення: відповідна змінна середовини (напр. LEELA_MAX_TOKENS_ENTRY).
 * Якщо немає — беруться дефолти для development або production.
 */
export function getLeelaMaxOutputTokens(kind: LeelaMaxTokensKind): number {
  const envKey = ENV_KEYS[kind];
  const fromEnv = parsePositiveInt(process.env[envKey]);
  if (fromEnv != null) return fromEnv;
  const table = isLeelaAiDevMode() ? DEV_DEFAULTS : PROD_DEFAULTS;
  return table[kind];
}
