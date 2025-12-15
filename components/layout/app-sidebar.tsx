"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Play, FileText, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { title: "Дашборд", href: "/", icon: LayoutDashboard },
  { title: "Товары", href: "/products", icon: Package },
  { title: "Процессы", href: "/processes", icon: Play },
  { title: "Шаблоны", href: "/templates", icon: FileText },
];

export function AppSidebar() {
  const pathname = usePathname();

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
      </div>
    </aside>
  );
}
