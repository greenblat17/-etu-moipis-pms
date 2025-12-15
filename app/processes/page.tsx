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
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface ProcessItem {
  id_process: number;
  id_prod: string;
  product_name?: string;
  template_name?: string;
  current_state?: { state_name: string; state_sh_name?: string };
}

export default function ProcessesPage() {
  const router = useRouter();
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [templates, setTemplates] = useState<{ id_type_proc: number; name: string }[]>([]);
  const [products, setProducts] = useState<{ id_prod: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ type_pr: "", id_prod: "" });

  useEffect(() => {
    Promise.all([
      fetch("/api/processes").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([p, t, pr]) => {
        setProcesses(p);
        setTemplates(t);
        setProducts(pr);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.type_pr || !form.id_prod) {
      toast.error("Выберите шаблон и товар");
      return;
    }

    const res = await fetch("/api/processes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type_pr: parseInt(form.type_pr),
        id_prod: form.id_prod,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/processes/${data.id_process}`);
    } else {
      toast.error("Ошибка создания");
    }
  };

  const getStateColor = (sh_name?: string) => {
    if (!sh_name) return "secondary";
    if (sh_name.includes("published") || sh_name.includes("completed")) return "default";
    if (sh_name.includes("draft") || sh_name.includes("select")) return "secondary";
    if (sh_name.includes("moderation") || sh_name.includes("approval")) return "outline";
    return "secondary";
  };

  return (
    <PageContainer
      title="Процессы"
      actions={
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Запустить
        </Button>
      }
    >
      {loading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Товар</TableHead>
              <TableHead>Шаблон</TableHead>
              <TableHead>Состояние</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processes.map((p) => (
              <TableRow
                key={p.id_process}
                className="cursor-pointer"
                onClick={() => router.push(`/processes/${p.id_process}`)}
              >
                <TableCell className="font-mono">{p.id_process}</TableCell>
                <TableCell>{p.product_name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {p.template_name}
                </TableCell>
                <TableCell>
                  <Badge variant={getStateColor(p.current_state?.state_sh_name)}>
                    {p.current_state?.state_name || "—"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Запустить процесс</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Select
              value={form.type_pr}
              onValueChange={(v) => setForm({ ...form, type_pr: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Шаблон процесса" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id_type_proc} value={t.id_type_proc.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={form.id_prod}
              onValueChange={(v) => setForm({ ...form, id_prod: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Товар" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id_prod} value={p.id_prod}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreate}>Запустить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
