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
import { Plus, CircleDot, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { StateType } from "@/lib/types";

// Предустановленные состояния из ТЗ
const PRESET_STATES = [
  // Процесс 1: Включение нового товара
  { sh_name: "draft", name: "Черновик карточки" },
  { sh_name: "moderation", name: "На модерации" },
  { sh_name: "published", name: "Опубликован" },
  { sh_name: "corrections", name: "Запрошены правки" },
  { sh_name: "rejected", name: "Отклонён" },
  { sh_name: "paused", name: "Приостановлен" },
  { sh_name: "cancelled", name: "Отменён" },
  { sh_name: "archived", name: "Архив" },
  // Процесс 2: Управление изменениями
  { sh_name: "select_product", name: "Выбор товара" },
  { sh_name: "create_copy", name: "Создание копии" },
  { sh_name: "edit_params", name: "Редактирование параметров" },
  { sh_name: "mod_approval", name: "Согласование модератором" },
  { sh_name: "mgr_approval", name: "Согласование руководителем" },
  { sh_name: "change_permission", name: "Разрешение на ввод изменений" },
  { sh_name: "apply_changes", name: "Ввод изменений в действие" },
  { sh_name: "postponed", name: "Изменение отложено" },
  { sh_name: "completed", name: "Изменение введено" },
];

export default function StatesPage() {
  const [states, setStates] = useState<StateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<StateType | null>(null);
  const [formData, setFormData] = useState({ sh_name: "", name: "" });

  const fetchStates = async () => {
    try {
      const res = await fetch("/api/states");
      const data = await res.json();
      setStates(data);
    } catch {
      toast.error("Ошибка загрузки состояний");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const handleCreate = () => {
    setSelectedState(null);
    setFormData({ sh_name: "", name: "" });
    setDialogOpen(true);
  };

  const handleEdit = (item: StateType) => {
    setSelectedState(item);
    setFormData({ sh_name: item.sh_name, name: item.name });
    setDialogOpen(true);
  };

  const handleDelete = (item: StateType) => {
    setSelectedState(item);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.sh_name || !formData.name) {
      toast.error("Заполните все поля");
      return;
    }

    try {
      const url = selectedState
        ? `/api/states/${selectedState.id_state}`
        : "/api/states";
      const method = selectedState ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка сохранения");
      }

      toast.success(selectedState ? "Состояние обновлено" : "Состояние создано");
      setDialogOpen(false);
      fetchStates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const confirmDelete = async () => {
    if (!selectedState) return;

    try {
      const res = await fetch(`/api/states/${selectedState.id_state}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Ошибка удаления");

      toast.success("Состояние удалено");
      setDeleteDialogOpen(false);
      fetchStates();
    } catch {
      toast.error("Ошибка удаления состояния");
    }
  };

  const handleLoadPresets = async () => {
    let created = 0;
    let skipped = 0;

    for (const preset of PRESET_STATES) {
      try {
        const res = await fetch("/api/states", {
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
    fetchStates();
  };

  const columns = [
    {
      key: "id_state",
      header: "ID",
      className: "w-[80px]",
    },
    {
      key: "sh_name",
      header: "Код",
      render: (item: StateType) => (
        <code className="rounded bg-muted px-2 py-1 text-sm">
          {item.sh_name}
        </code>
      ),
    },
    {
      key: "name",
      header: "Название",
      render: (item: StateType) => (
        <div className="flex items-center gap-2">
          <CircleDot className="h-4 w-4 text-muted-foreground" />
          {item.name}
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Типы состояний"
      description="Справочник состояний для процессов"
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
          data={states}
          columns={columns}
          getRowKey={(item) => item.id_state}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Состояния не найдены"
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedState ? "Редактировать состояние" : "Новое состояние"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Код (sh_name) *</label>
              <Input
                placeholder="draft"
                value={formData.sh_name}
                onChange={(e) =>
                  setFormData({ ...formData, sh_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Название *</label>
              <Input
                placeholder="Черновик карточки"
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
              {selectedState ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Удалить состояние?"
        description={`Вы уверены, что хотите удалить состояние "${selectedState?.name}"?`}
        confirmText="Удалить"
        variant="destructive"
        onConfirm={confirmDelete}
      />

      {/* Preset Dialog */}
      <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Загрузить состояния из ТЗ</DialogTitle>
            <DialogDescription>
              Будут добавлены {PRESET_STATES.length} состояний из диаграмм процессов.
              Существующие состояния не будут перезаписаны.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto py-4">
            <div className="flex flex-wrap gap-2">
              {PRESET_STATES.map((s) => (
                <Badge key={s.sh_name} variant="secondary">
                  {s.name}
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

