"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id_type_proc: number;
  name: string;
  sh_name: string;
  id_class?: number | null;
  class_name?: string;
}

interface ProductClass {
  id_class: number;
  name: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [classes, setClasses] = useState<ProductClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    sh_name: "",
    name: "",
    id_class: null as number | null,
  });

  const fetchData = async () => {
    try {
      const [templatesRes, classesRes] = await Promise.all([
        fetch("/api/templates"),
        fetch("/api/classes"),
      ]);
      setTemplates(await templatesRes.json());
      setClasses(await classesRes.json());
    } catch {
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!formData.sh_name || !formData.name) {
      toast.error("Заполните код и название");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка создания");
      }

      toast.success("Шаблон создан");
      setDialogOpen(false);
      setFormData({ sh_name: "", name: "", id_class: null });
      fetchData();
      
      // Перейти к настройке шаблона
      router.push(`/templates/${data.id_type_proc}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка создания");
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageContainer
      title="Шаблоны процессов"
      description="Определяют состояния, решения и переходы"
      actions={
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Создать шаблон
        </Button>
      }
    >
      {loading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : templates.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Шаблоны не созданы</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Создать первый шаблон
            </Button>
          </div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead className="w-32">Код</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Класс товаров</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((t) => (
              <TableRow
                key={t.id_type_proc}
                className="cursor-pointer hover:bg-accent"
                onClick={() => router.push(`/templates/${t.id_type_proc}`)}
              >
                <TableCell className="font-mono">{t.id_type_proc}</TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-2 py-0.5 text-sm">
                    {t.sh_name}
                  </code>
                </TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {t.class_name || "Все классы"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Диалог создания шаблона */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Новый шаблон процесса</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Код (sh_name) *</label>
              <Input
                placeholder="new_product"
                value={formData.sh_name}
                onChange={(e) =>
                  setFormData({ ...formData, sh_name: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Уникальный идентификатор (латиница, без пробелов)
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Название *</label>
              <Input
                placeholder="Публикация нового товара"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Класс товаров</label>
              <Select
                value={formData.id_class?.toString() || "all"}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    id_class: v === "all" ? null : parseInt(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все классы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все классы</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id_class} value={c.id_class.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Ограничить шаблон определённым классом товаров
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
