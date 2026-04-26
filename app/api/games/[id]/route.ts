import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GameHistoryItem = { cellNumber: number; cellName: string; timestamp: string };
type ChatItem = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  kind?: "entry" | "cell";
  cellId?: number;
};

function bad(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return bad("Unauthorized", 401);
  }
  const { id } = await params;

  const game = await prisma.game.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!game) {
    return bad("Not found", 404);
  }

  return NextResponse.json({
    id: game.id,
    userId: game.userId,
    playerRequest: game.playerRequest,
    currentPosition: game.currentPosition,
    gameHistory: game.gameHistory,
    chatHistory: game.chatHistory,
    isCompleted: game.isCompleted,
    finalSummary: game.finalSummary,
    actionPlan: game.actionPlan,
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return bad("Unauthorized", 401);
  }
  const { id } = await params;

  const existing = await prisma.game.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return bad("Not found", 404);
  }
  if (existing.isCompleted) {
    return bad("Game is completed", 409);
  }

  let body: {
    currentPosition?: number;
    gameHistory?: GameHistoryItem[];
    chatHistory?: ChatItem[];
    playerRequest?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return bad("Invalid JSON", 400);
  }

  const data: Prisma.GameUpdateInput = {};
  if (body.currentPosition !== undefined) {
    if (typeof body.currentPosition !== "number" || !Number.isFinite(body.currentPosition)) {
      return bad("Invalid currentPosition", 400);
    }
    data.currentPosition = body.currentPosition;
  }
  if (body.gameHistory !== undefined) {
    if (!Array.isArray(body.gameHistory)) return bad("Invalid gameHistory", 400);
    data.gameHistory = body.gameHistory as unknown as Prisma.InputJsonValue;
  }
  if (body.chatHistory !== undefined) {
    if (!Array.isArray(body.chatHistory)) return bad("Invalid chatHistory", 400);
    data.chatHistory = body.chatHistory as unknown as Prisma.InputJsonValue;
  }
  if (body.playerRequest !== undefined) {
    if (typeof body.playerRequest !== "string") return bad("Invalid playerRequest", 400);
    data.playerRequest = body.playerRequest;
  }

  if (Object.keys(data).length === 0) {
    return bad("No fields to update", 400);
  }

  await prisma.game.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true });
}
