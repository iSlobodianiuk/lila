"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ChatHistoryPersistItem, GameHistoryItem } from "@/lib/types";

type CreateGameInput = {
  playerRequest: string;
  currentPosition: number;
  gameHistory: GameHistoryItem[];
  chatHistory: ChatHistoryPersistItem[];
};

type CreateGameResult = { id: string };

type AppendMoveInput = {
  gameId: string;
  currentPosition: number;
  move: GameHistoryItem;
  chatHistory?: ChatHistoryPersistItem[];
  playerRequest?: string;
};

type AppendMoveResult = { ok: true };

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function assertAuthUserId(session: Awaited<ReturnType<typeof auth>>): string {
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

function assertGameHistoryItem(item: unknown): asserts item is GameHistoryItem {
  const value = item as GameHistoryItem | undefined;
  if (
    !value ||
    !isFiniteNumber(value.cellNumber) ||
    typeof value.cellName !== "string" ||
    typeof value.timestamp !== "string"
  ) {
    throw new Error("Invalid game history item");
  }
}

function assertChatHistory(items: unknown): asserts items is ChatHistoryPersistItem[] {
  if (!Array.isArray(items)) {
    throw new Error("Invalid chat history");
  }
}

function assertCreateInput(input: CreateGameInput): void {
  if (typeof input.playerRequest !== "string" || !input.playerRequest.trim()) {
    throw new Error("Invalid playerRequest");
  }
  if (!isFiniteNumber(input.currentPosition)) {
    throw new Error("Invalid currentPosition");
  }
  if (!Array.isArray(input.gameHistory)) {
    throw new Error("Invalid gameHistory");
  }
  input.gameHistory.forEach(assertGameHistoryItem);
  assertChatHistory(input.chatHistory);
}

export async function createGameForCurrentUser(input: CreateGameInput): Promise<CreateGameResult> {
  const session = await auth();
  const userId = assertAuthUserId(session);
  assertCreateInput(input);

  const game = await prisma.game.create({
    data: {
      userId,
      playerRequest: input.playerRequest.trim(),
      currentPosition: input.currentPosition,
      gameHistory: input.gameHistory as unknown as Prisma.InputJsonValue,
      chatHistory: input.chatHistory as unknown as Prisma.InputJsonValue,
      isCompleted: false,
    },
    select: { id: true },
  });

  return { id: game.id };
}

export async function appendMoveForCurrentUser(input: AppendMoveInput): Promise<AppendMoveResult> {
  const session = await auth();
  const userId = assertAuthUserId(session);

  if (typeof input.gameId !== "string" || !input.gameId) {
    throw new Error("Invalid gameId");
  }
  if (!isFiniteNumber(input.currentPosition)) {
    throw new Error("Invalid currentPosition");
  }
  assertGameHistoryItem(input.move);
  if (input.chatHistory !== undefined) {
    assertChatHistory(input.chatHistory);
  }
  if (input.playerRequest !== undefined && typeof input.playerRequest !== "string") {
    throw new Error("Invalid playerRequest");
  }

  const game = await prisma.game.findFirst({
    where: { id: input.gameId, userId },
    select: { isCompleted: true, gameHistory: true },
  });

  if (!game) {
    throw new Error("Game not found");
  }
  if (game.isCompleted) {
    throw new Error("Game is completed");
  }

  const existingHistory = Array.isArray(game.gameHistory) ? (game.gameHistory as unknown as GameHistoryItem[]) : [];
  const nextHistory = [...existingHistory, input.move];

  const data: Prisma.GameUpdateInput = {
    currentPosition: input.currentPosition,
    gameHistory: nextHistory as unknown as Prisma.InputJsonValue,
  };
  if (input.chatHistory !== undefined) {
    data.chatHistory = input.chatHistory as unknown as Prisma.InputJsonValue;
  }
  if (input.playerRequest !== undefined) {
    data.playerRequest = input.playerRequest;
  }

  await prisma.game.update({
    where: { id: input.gameId },
    data,
  });

  return { ok: true };
}
