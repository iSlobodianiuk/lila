"use server";

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getLeelaMaxOutputTokens } from "@/lib/leela-ai-limits";

const LEELA_SYSTEM_PROMPT = `
Ти — Провідник у грі Ліла (Leela), давній індійській грі самопізнання.
Твоя роль: допомагати гравцю осмислити поточну клітинку і її зв'язок
з його питанням на початку гри.

Правила поведінки:
- Говори м'яко, як мудрий наставник, не як чат-бот
- Не давай прямих відповідей — задавай питання, що спонукають до рефлексії
- Кожна клітинка має свою тему (наприклад: 68 = Земля, 1 = Народження тощо)
- Пов'язуй клітинку з питанням, яке гравець поставив на початку гри
- Відповідай українською мовою, коротко (3-5 речень)
- Уникай духовного жаргону та кліше
`;

type GuideMessage = { role: "user" | "assistant"; content: string };
type GuideContext = {
  cellNumber: number;
  cellName: string;
  playerQuestion: string;
  moveCount: number;
};
type GuideResponseResult = { text: string } | { error: string };

export async function getGuideResponse(
  messages: GuideMessage[],
  gameContext: GuideContext,
): Promise<GuideResponseResult> {
  const contextualSystem = `${LEELA_SYSTEM_PROMPT}

ПОТОЧНИЙ КОНТЕКСТ ГРИ:
- Питання гравця на початку: "${gameContext.playerQuestion}"
- Поточна клітинка: ${gameContext.cellNumber} — "${gameContext.cellName}"
- Хід номер: ${gameContext.moveCount}`;

  try {
    const { text } = await generateText({
      model: openai(process.env.LEELA_MODEL ?? "gpt-4o-mini"),
      system: contextualSystem,
      messages,
      maxOutputTokens: getLeelaMaxOutputTokens("guide"),
    });
    return { text: text.trim() };
  } catch {
    return { error: "Провідник наразі мовчить. Спробуйте ще раз за мить." };
  }
}
