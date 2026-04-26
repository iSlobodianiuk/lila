import type { Cell } from "./types";

type InsightInput = {
  query: string;
  cell: Cell;
};

const KEYWORD_RESPONSES: Array<{ keywords: string[]; message: string }> = [
  {
    keywords: ["стосун", "кохан", "партнер", "сім"],
    message: "Подивись, де ти очікуєш контроль замість живого діалогу. Малий чесний крок назустріч часто змінює весь сценарій.",
  },
  {
    keywords: ["робот", "кар", "грош", "бізнес"],
    message: "Поточна клітинка просить поєднати дисципліну з ясністю наміру. Обери одну конкретну дію на 24 години і доведи її до кінця.",
  },
  {
    keywords: ["страх", "тривог", "невпевн", "сумнів"],
    message: "Не воюй зі страхом, а назви його вголос і заземлись дією. Повернення в тіло і ритм зменшує внутрішній шум.",
  },
  {
    keywords: ["сенс", "шлях", "признач", "духов"],
    message: "Ця позиція нагадує: сенс розкривається через практику, а не лише через роздуми. Підтримуй щоденний ритуал і спостерігай зміни.",
  },
];

export function generateInsight({ query, cell }: InsightInput): string {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedCell = `${cell.name} ${cell.description}`.toLowerCase();

  if (!normalizedQuery) {
    return `Точка "${cell.name}" запрошує до уважності: зроби паузу, відчуй стан тіла і сформулюй один намір на цей крок гри.`;
  }

  const matched = KEYWORD_RESPONSES.find(({ keywords }) =>
    keywords.some((kw) => normalizedQuery.includes(kw)),
  );

  if (matched) {
    return `${matched.message} Фокус цієї клітинки: ${cell.description.toLowerCase()}`;
  }

  if (normalizedCell.includes("очищ") || normalizedCell.includes("вогонь")) {
    return "Твій запит просить очищення пріоритетів: прибери один зайвий імпульс сьогодні, щоб звільнити енергію для головного.";
  }

  if (normalizedCell.includes("насиль")) {
    return "Цей стан попереджає про жорсткість до себе чи інших. Заміни реакцію на усвідомлену відповідь і повернись до мови поваги.";
  }

  return `Поєднай запит "${query.trim()}" з уроком клітинки "${cell.name}": обери одну мікродію, яку реально виконати сьогодні, і зафіксуй результат ввечері.`;
}
