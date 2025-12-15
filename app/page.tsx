"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, Play, FileText, FolderTree } from "lucide-react";
import Link from "next/link";

interface Stats {
  products: number;
  processes: number;
  templates: number;
  classes: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    products: 0,
    processes: 0,
    templates: 0,
    classes: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [products, processes, templates, classes] = await Promise.all([
          fetch("/api/products").then((r) => r.json()),
          fetch("/api/processes").then((r) => r.json()),
          fetch("/api/templates").then((r) => r.json()),
          fetch("/api/classes").then((r) => r.json()),
        ]);

        setStats({
          products: Array.isArray(products) ? products.length : 0,
          processes: Array.isArray(processes) ? processes.length : 0,
          templates: Array.isArray(templates) ? templates.length : 0,
          classes: Array.isArray(classes) ? classes.length : 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: "Товары",
      value: stats.products,
      icon: Package,
      href: "/products",
      color: "text-blue-500",
    },
    {
      title: "Процессы",
      value: stats.processes,
      icon: Play,
      href: "/processes",
      color: "text-green-500",
    },
    {
      title: "Шаблоны",
      value: stats.templates,
      icon: FileText,
      href: "/templates",
      color: "text-purple-500",
    },
    {
      title: "Классы",
      value: stats.classes,
      icon: FolderTree,
      href: "/classes",
      color: "text-amber-500",
    },
  ];

  return (
    <PageContainer title="Дашборд" description="Система управления процессами">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
