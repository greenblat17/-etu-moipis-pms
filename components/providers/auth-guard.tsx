"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (status === "loading") return;

    if (!session && !isLoginPage) {
      router.push("/login");
    }

    if (session && isLoginPage) {
      router.push("/");
    }
  }, [session, status, isLoginPage, router]);

  // Показываем загрузку пока проверяем сессию
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  // На странице логина без сессии — показываем страницу (без сайдбара)
  if (isLoginPage && !session) {
    return <>{children}</>;
  }

  // Не авторизован — пустой экран (редирект в useEffect)
  if (!session) {
    return null;
  }

  // Авторизован — показываем с сайдбаром
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="ml-56 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

