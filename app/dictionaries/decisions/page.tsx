"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, GitBranch, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { DecisionType } from "@/lib/types";

// Предустановленные решения из ТЗ
const PRESET_DECISIONS = [
  // Процесс 1: Включение нового товара
  { sh_name: "submit", name: "Отправить на модерацию" },
  { sh_name: "approve", name: "Одобрить" },
  { sh_name: "reject", name: "Отклонить" },
  { sh_name: "request_changes", name: "Запросить правки" },
  { sh_name: "apply_changes", name: "Внести правки" },
  { sh_name: "pause", name: "Приостановить" },
  { sh_name: "resume", name: "Возобновить" },
  { sh_name: "archive", name: "Архивировать" },
  { sh_name: "cancel", name: "Отменить" },
  // Процесс 2: Управление изменениями
  { sh_name: "create_copy", name: "Создать копию" },
  { sh_name: "start_edit", name: "Начать редактирование" },
  { sh_name: "to_moderation", name: "На модерацию" },
  { sh_name: "revision", name: "На доработку" },
  { sh_name: "mod_approved", name: "Согласовано модератором" },
  { sh_name: "mgr_approved", name: "Согласовано руководителем" },
  { sh_name: "allow", name: "Разрешить ввод" },
  { sh_name: "postpone", name: "Отложить" },
  { sh_name: "retry", name: "Повторить" },
  { sh_name: "done", name: "Завершено" },
];

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<DecisionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<DecisionType | null>(null);
  const [formData, setFormData] = useState({ sh_name: "", name: "" });

  const fetchDecisions = async () => {
    try {
      const res = await fetch("/api/decisions");
      const data = await res.json();
      setDecisions(data);
    } catch {
      toast.error("Ошибка загрузки решений");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  const handleCreate = () => {
    setSelectedDecision(null);
    setFormData({ sh_name: "", name: "" });
    setDialogOpen(true);
  };

  const handleEdit = (item: DecisionType) => {
    setSelectedDecision(item);
    setFormData({ sh_name: item.sh_name, name: item.name });
    setDialogOpen(true);
  };

  const handleDelete = (item: DecisionType) => {
    setSelectedDecision(item);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.sh_name || !formData.name) {
      toast.error("Заполните все поля");
      return;
    }

    try {
      const url = selectedDecision
        ? `/api/decisions/${selectedDecision.id_dec}`
        : "/api/decisions";
      const method = selectedDecision ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка сохранения");
      }

      toast.success(selectedDecision ? "Решение обновлено" : "Решение создано");
      setDialogOpen(false);
      fetchDecisions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const confirmDelete = async () => {
    if (!selectedDecision) return;

    try {
      const res = await fetch(`/api/decisions/${selectedDecision.id_dec}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Ошибка удаления");

      toast.success("Решение удалено");
      setDeleteDialogOpen(false);
      fetchDecisions();
    } catch {
      toast.error("Ошибка удаления решения");
    }
  };

  const handleLoadPresets = async () => {
    let created = 0;
    let skipped = 0;

    for (const preset of PRESET_DECISIONS) {
      try {
        const res = await fetch("/api/decisions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preset),
        });
        const data = await res.json();
        if (data.o_res === 1) created++;
        else skipped++;
      } catch {
        // ignore
      }
    }

    toast.success(`Создано: ${created}, пропущено: ${skipped}`);
    setPresetDialogOpen(false);
    fetchDecisions();
  };

  const columns = [
    {
      key: "id_dec",
      header: "ID",
      className: "w-[80px]",
    },
    {
      key: "sh_name",
      header: "Код",
      render: (item: DecisionType) => (
        <code className="rounded bg-muted px-2 py-1 text-sm">
          {item.sh_name}
        </code>
      ),
    },
    {
      key: "name",
      header: "Название",
      render: (item: DecisionType) => (
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          {item.name}
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Типы решений"
      description="Справочник решений для переходов между состояниями"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPresetDialogOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Загрузить из ТЗ
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      ) : (
        <DataTable
          data={decisions}
          columns={columns}
          getRowKey={(item) => item.id_dec}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Решения не найдены"
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDecision ? "Редактировать решение" : "Новое решение"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Код (sh_name) *</label>
              <Input
                placeholder="approve"
                value={formData.sh_name}
                onChange={(e) =>
                  setFormData({ ...formData, sh_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Название *</label>
              <Input
                placeholder="Одобрить"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit}>
              {selectedDecision ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Удалить решение?"
        description={`Вы уверены, что хотите удалить решение "${selectedDecision?.name}"?`}
        confirmText="Удалить"
        variant="destructive"
        onConfirm={confirmDelete}
      />

      {/* Preset Dialog */}
      <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Загрузить решения из ТЗ</DialogTitle>
            <DialogDescription>
              Будут добавлены {PRESET_DECISIONS.length} решений из диаграмм процессов.
              Существующие решения не будут перезаписаны.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto py-4">
            <div className="flex flex-wrap gap-2">
              {PRESET_DECISIONS.map((d) => (
                <Badge key={d.sh_name} variant="secondary">
                  {d.name}
                </Badge>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPresetDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleLoadPresets}>
              <Sparkles className="mr-2 h-4 w-4" />
              Загрузить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

