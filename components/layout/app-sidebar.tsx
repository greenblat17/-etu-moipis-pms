"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Package, Play, FileText, LayoutDashboard, LogOut, User, FolderTree, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { title: "Дашборд", href: "/", icon: LayoutDashboard },
  { title: "Товары", href: "/products", icon: Package },
  { title: "Классы", href: "/classes", icon: FolderTree },
  { title: "Процессы", href: "/processes", icon: Play },
  { title: "Шаблоны", href: "/templates", icon: FileText },
  { title: "ДНФ-логика", href: "/dnf", icon: GitBranch },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link href="/" className="text-lg font-semibold">
            PMS
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        {session?.user && (
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2 rounded-md bg-accent/50 p-2">
              <User className="h-8 w-8 rounded-full bg-primary/20 p-1.5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{session.user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {(session.user as any).groupName}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full justify-start text-muted-foreground"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
