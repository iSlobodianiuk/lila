"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export function AppHeader() {
  const { data: session, status } = useSession();

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      {status === "loading" ? (
        <span className="text-xs text-stone-500">…</span>
      ) : session ? (
        <>
          <span className="max-w-[12rem] truncate text-xs text-stone-600 sm:text-sm">
            {session.user?.name ?? session.user?.email}
          </span>
          <Link
            href="/dashboard"
            className="rounded-full border border-stone-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Кабінет
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-full bg-stone-200/80 px-3 py-1.5 text-xs font-medium text-stone-800 transition hover:bg-stone-300/80"
          >
            Вийти
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="rounded-full bg-stone-900/90 px-4 py-2 text-xs font-medium text-stone-50 transition hover:bg-stone-900"
        >
          Увійти через Google
        </button>
      )}
    </div>
  );
}
