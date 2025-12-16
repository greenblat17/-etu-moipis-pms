"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

const users = [
  { id: 1, name: "Админ Админович", role: "Администратор" },
  { id: 2, name: "Модератор Модераторович", role: "Модератор" },
  { id: 3, name: "Руководитель Руководителевич", role: "Руководитель" },
  { id: 4, name: "Менеджер Менеджерович", role: "Менеджер" },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);

  const handleLogin = async (userId: number) => {
    setLoading(userId);
    const result = await signIn("credentials", {
      userId: userId.toString(),
      redirect: false,
    });

    if (result?.ok) {
      router.push("/");
      router.refresh();
    }
    setLoading(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">
            Система управления процессами
          </CardTitle>
          <p className="text-slate-400">Выберите пользователя для входа</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <Button
              key={user.id}
              variant="outline"
              className="w-full justify-start gap-3 border-slate-600 bg-slate-700/50 text-white hover:bg-slate-600"
              onClick={() => handleLogin(user.id)}
              disabled={loading !== null}
            >
              <User className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span>{user.name}</span>
                <span className="text-xs text-slate-400">{user.role}</span>
              </div>
              {loading === user.id && (
                <span className="ml-auto animate-spin">⏳</span>
              )}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

