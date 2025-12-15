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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Parameter } from "@/lib/types";

const PARAM_TYPES = [
  { value: "string", label: "Строка" },
  { value: "number", label: "Число" },
  { value: "boolean", label: "Да/Нет" },
  { value: "date", label: "Дата" },
];

export default function ParametersPage() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedParam, setSelectedParam] = useState<Parameter | null>(null);
  const [formData, setFormData] = useState({
    short_name: "",
    name: "",
    type_par: "string",
  });

  const fetchParameters = async () => {
    try {
      const res = await fetch("/api/parameters");
      const data = await res.json();
      setParameters(data);
    } catch {
      toast.error("Ошибка загрузки параметров");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, []);

  const handleCreate = () => {
    setSelectedParam(null);
    setFormData({ short_name: "", name: "", type_par: "string" });
    setDialogOpen(true);
  };

  const handleEdit = (item: Parameter) => {
    setSelectedParam(item);
    setFormData({
      short_name: item.short_name,
      name: item.name,
      type_par: item.type_par,
    });
    setDialogOpen(true);
  };

  const handleDelete = (item: Parameter) => {
    setSelectedParam(item);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.short_name || !formData.name || !formData.type_par) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    try {
      const url = selectedParam
        ? `/api/parameters/${selectedParam.id_par}`
        : "/api/parameters";
      const method = selectedParam ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка сохранения");
      }

      toast.success(selectedParam ? "Параметр обновлён" : "Параметр создан");
      setDialogOpen(false);
      fetchParameters();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const confirmDelete = async () => {
    if (!selectedParam) return;

    try {
      const res = await fetch(`/api/parameters/${selectedParam.id_par}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Ошибка удаления");

      toast.success("Параметр удалён");
      setDeleteDialogOpen(false);
      fetchParameters();
    } catch {
      toast.error("Ошибка удаления параметра");
    }
  };

  const getTypeLabel = (type: string) => {
    return PARAM_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "string":
        return "default";
      case "number":
        return "secondary";
      case "boolean":
        return "outline";
      default:
        return "default";
    }
  };

  const columns = [
    {
      key: "id_par",
      header: "ID",
      className: "w-[80px]",
    },
    {
      key: "short_name",
      header: "Код",
      render: (item: Parameter) => (
        <code className="rounded bg-muted px-2 py-1 text-sm">
          {item.short_name}
        </code>
      ),
    },
    {
      key: "name",
      header: "Название",
    },
    {
      key: "type_par",
      header: "Тип",
      render: (item: Parameter) => (
        <Badge variant={getTypeBadgeVariant(item.type_par) as "default" | "secondary" | "outline"}>
          {getTypeLabel(item.type_par)}
        </Badge>
      ),
    },
  ];

  return (
    <PageContainer
      title="Параметры"
      description="Справочник параметров товаров"
      actions={
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить параметр
        </Button>
      }
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      ) : (
        <DataTable
          data={parameters}
          columns={columns}
          getRowKey={(item) => item.id_par}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Параметры не найдены"
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedParam ? "Редактировать параметр" : "Новый параметр"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Код (short_name) *</label>
              <Input
                placeholder="color"
                value={formData.short_name}
                onChange={(e) =>
                  setFormData({ ...formData, short_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Название *</label>
              <Input
                placeholder="Цвет"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Тип данных *</label>
              <Select
                value={formData.type_par}
                onValueChange={(value) =>
                  setFormData({ ...formData, type_par: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {PARAM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit}>
              {selectedParam ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Удалить параметр?"
        description={`Вы уверены, что хотите удалить параметр "${selectedParam?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </PageContainer>
  );
}

