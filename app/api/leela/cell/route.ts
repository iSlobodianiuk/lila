import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { buildCellInsightUserPrompt, fillSystemPrompt } from "@/src/prompts/leela";

export const runtime = "nodejs";

type Body = {
  playerRequest: string;
  cellId: number;
  cellName: string;
  cellDescription: string;
};

function mockCellResponse(input: {
  cellId: number;
  cellName: string;
}): string {
  return `Що для тебе зараз найважливіше у клітинці «${input.cellName}» (№${input.cellId}) у контексті твого запиту? Що ти вперше зауважив про свою ситуацію, коли тут опинився?`;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { playerRequest, cellId, cellName, cellDescription } = body;
  if (
    typeof cellId !== "number" ||
    !cellName ||
    typeof cellDescription !== "string" ||
    typeof playerRequest !== "string"
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ text: mockCellResponse({ cellId, cellName }) });
  }

  const system = fillSystemPrompt(playerRequest);
  const user = buildCellInsightUserPrompt({
    playerRequest,
    cellNumber: cellId,
    cellName,
    cellDescription,
  });

  const result = await generateText({
    model: openai(process.env.LEELA_MODEL ?? "gpt-4o-mini"),
    system,
    prompt: user,
    maxOutputTokens: 600,
  });

  return NextResponse.json({ text: result.text });
}
