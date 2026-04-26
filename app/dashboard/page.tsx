import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  const games = await prisma.game.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-3 py-8 sm:px-6">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl text-stone-800 sm:text-3xl">Кабінет</h1>
          <p className="mt-1 text-sm text-stone-500">Твої збережені ігри «Ліла»</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="rounded-full border border-stone-200 bg-white/90 px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
          >
            До гри
          </Link>
          <AppHeader />
        </div>
      </div>

      {games.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-center text-sm text-stone-600">
          Поки немає збережених ігор.{" "}
          <Link className="font-medium text-amber-800 underline-offset-2 hover:underline" href="/">
            Розпочни першу
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {games.map((g) => (
            <li
              key={g.id}
              className="rounded-2xl border border-stone-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-stone-800">
                    {g.playerRequest}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Оновлено: {g.updatedAt.toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" })}{" "}
                    · Клітинка {g.currentPosition}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  <span
                    className={
                      g.isCompleted
                        ? "inline-flex justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
                        : "inline-flex justify-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900"
                    }
                  >
                    {g.isCompleted ? "Завершена" : "В процесі"}
                  </span>
                  {g.isCompleted ? (
                    <Link
                      className="text-center text-xs font-medium text-sky-800 underline-offset-2 hover:underline"
                      href={`/?continue=${g.id}`}
                    >
                      Відкрити результат
                    </Link>
                  ) : (
                    <Link
                      className="rounded-full bg-stone-900/90 px-3 py-1.5 text-center text-xs font-medium text-stone-50 transition hover:bg-stone-900"
                      href={`/?continue=${g.id}`}
                    >
                      Продовжити гру
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
