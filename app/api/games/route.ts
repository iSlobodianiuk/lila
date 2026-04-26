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

/**
 * Список ігор поточного користувача.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return bad("Unauthorized", 401);
  }

  const games = await prisma.game.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      playerRequest: true,
      currentPosition: true,
      isCompleted: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ games });
}

/**
 * Створити запис гри.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return bad("Unauthorized", 401);
  }

  let body: {
    playerRequest?: string;
    currentPosition?: number;
    gameHistory?: GameHistoryItem[];
    chatHistory?: ChatItem[];
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return bad("Invalid JSON", 400);
  }

  if (typeof body.playerRequest !== "string" || !Array.isArray(body.gameHistory) || !Array.isArray(body.chatHistory)) {
    return bad("Invalid body", 400);
  }

  if (typeof body.currentPosition !== "number" || !Number.isFinite(body.currentPosition)) {
    return bad("Invalid body", 400);
  }

  const since = new Date(Date.now() - 4000);
  const duplicate = await prisma.game.findFirst({
    where: {
      userId: session.user.id,
      isCompleted: false,
      playerRequest: body.playerRequest,
      currentPosition: body.currentPosition,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });
  if (duplicate) {
    return NextResponse.json({ id: duplicate.id, dedup: true });
  }

  const game = await prisma.game.create({
    data: {
      userId: session.user.id,
      playerRequest: body.playerRequest,
      currentPosition: body.currentPosition,
      gameHistory: body.gameHistory as unknown as Prisma.InputJsonValue,
      chatHistory: body.chatHistory as unknown as Prisma.InputJsonValue,
      isCompleted: false,
    },
  });

  return NextResponse.json({ id: game.id });
}
