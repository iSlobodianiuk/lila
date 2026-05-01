import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getLeelaMaxOutputTokens } from "@/lib/leela-ai-limits";
import { auth } from "@/auth";
import { sendGameResultEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import {
  buildFinalSummaryPrompt,
  formatChatHistoryForFinal,
  parseFinalModelOutput,
} from "@/src/prompts/leela";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function bad(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

type ChatItem = { role: string; content: string; timestamp: string };
type GameHistItem = { cellNumber: number; cellName: string; timestamp: string };

type RouteParams = { params: Promise<{ id: string }> };

function mockFinal(): { finalSummary: string; actionPlan: string } {
  return {
    finalSummary:
      "Підсумок згенеровано в режимі без OPENAI_API_KEY. Додайте ключ, щоб отримати повноцінний AI-висновок.",
    actionPlan:
      "1) Уточнити один крок на тиждень\n2) Записати прогрес\n3) Перевірити в кінці тижня\n4) Поговорити з однією близькою людиною\n5) Повторити цикл з невеликою корекцією",
  };
}

export async function POST(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return bad("Unauthorized", 401);
  }
  const { id } = await params;

  const game = await prisma.game.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!game) {
    return bad("Not found", 404);
  }

  if (game.isCompleted && game.finalSummary && game.actionPlan) {
    return NextResponse.json({
      finalSummary: game.finalSummary,
      actionPlan: game.actionPlan,
      alreadyComplete: true,
    });
  }

  if (game.currentPosition !== 68) {
    return bad("Game is not on the final cell (68)", 400);
  }

  const gh = game.gameHistory as unknown as GameHistItem[];
  const ch = game.chatHistory as unknown as ChatItem[];

  const pathShort = Array.isArray(gh)
    ? gh.map((c) => `${c.cellNumber}. ${c.cellName}`).join(" → ")
    : "";

  const chatText = formatChatHistoryForFinal(
    Array.isArray(ch)
      ? ch.map((c) => ({
          role: c.role,
          content: c.content,
          timestamp: c.timestamp,
        }))
      : [],
  );

  let finalSummary: string;
  let actionPlan: string;

  if (!process.env.OPENAI_API_KEY) {
    const m = mockFinal();
    finalSummary = m.finalSummary;
    actionPlan = m.actionPlan;
  } else {
    const userPrompt = buildFinalSummaryPrompt({
      playerRequest: game.playerRequest,
      gameHistory: Array.isArray(gh)
        ? gh.map((c) => ({ cellNumber: c.cellNumber, cellName: c.cellName }))
        : [],
      chatHistoryText: chatText,
    });
    const result = await generateText({
      model: openai(process.env.LEELA_MODEL ?? "gpt-4o-mini"),
      prompt: userPrompt,
      maxOutputTokens: getLeelaMaxOutputTokens("complete"),
    });
    const parsed = parseFinalModelOutput(result.text);
    finalSummary = parsed.finalSummary;
    actionPlan = parsed.actionPlan;
  }

  await prisma.game.update({
    where: { id: game.id },
    data: {
      isCompleted: true,
      finalSummary,
      actionPlan,
    },
  });

  const emailResult = await sendGameResultEmail({
    to: session.user.email,
    playerRequest: game.playerRequest,
    gamePath: pathShort,
    chatText: chatText || "—",
    finalSummary,
    actionPlan,
  });

  return NextResponse.json({
    finalSummary,
    actionPlan,
    emailSent: emailResult.ok,
    emailSkipped: emailResult.skipped,
  });
}
