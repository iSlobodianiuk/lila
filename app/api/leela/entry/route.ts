import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { buildEntryUserMessage, fillSystemPrompt } from "@/src/prompts/leela";

export const runtime = "nodejs";

type Body = {
  roll: number;
  queryDraft: string;
};

function mockEntryResponse(roll: number): string {
  if (roll <= 2) {
    return "Що саме ти хочеш змінити або зрозуміти після цієї гри — одним реченням?";
  }
  if (roll <= 4) {
    return "Яке питання для тебе зараз найболючіше у цьому запиті?";
  }
  if (roll === 5) {
    return "Сформулюй свій запит так, ніби пояснюєш його найближчому другові: про що саме йдеться?";
  }
  return "Запит прийнято. Гра починається — я поруч на кожному кроці. Готовий рухатися далі.";
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const roll = Number(body.roll);
  const queryDraft = typeof body.queryDraft === "string" ? body.queryDraft : "";
  if (!Number.isInteger(roll) || roll < 1 || roll > 6) {
    return NextResponse.json({ error: "Invalid roll" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ text: mockEntryResponse(roll) });
  }

  const system = fillSystemPrompt(queryDraft.trim() || "— (уточнюється на етапі входу)");
  const user = buildEntryUserMessage(roll, queryDraft);

  const result = await generateText({
    model: openai(process.env.LEELA_MODEL ?? "gpt-4o-mini"),
    system,
    prompt: user,
    maxOutputTokens: 500,
  });

  return NextResponse.json({ text: result.text });
}
