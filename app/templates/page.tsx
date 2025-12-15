"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Template {
  id_type_proc: number;
  name: string;
  sh_name: string;
  class_name?: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => toast.error("Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer title="Шаблоны процессов">
      {loading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Класс товаров</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((t) => (
              <TableRow
                key={t.id_type_proc}
                className="cursor-pointer"
                onClick={() => router.push(`/templates/${t.id_type_proc}`)}
              >
                <TableCell className="font-mono">{t.id_type_proc}</TableCell>
                <TableCell>{t.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {t.class_name || "Все классы"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </PageContainer>
  );
}
