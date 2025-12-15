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
import { Plus, FolderTree } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { ProductClass } from "@/lib/types";

export default function ClassesPage() {
  const [classes, setClasses] = useState<ProductClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ProductClass | null>(null);
  const [formData, setFormData] = useState({
    short_name: "",
    name: "",
    main_class: null as number | null,
  });

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      setClasses(data);
    } catch {
      toast.error("Ошибка загрузки классов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreate = () => {
    setSelectedClass(null);
    setFormData({ short_name: "", name: "", main_class: null });
    setDialogOpen(true);
  };

  const handleEdit = (item: ProductClass) => {
    setSelectedClass(item);
    setFormData({
      short_name: item.short_name,
      name: item.name,
      main_class: item.main_class,
    });
    setDialogOpen(true);
  };

  const handleDelete = (item: ProductClass) => {
    setSelectedClass(item);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.short_name || !formData.name) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    try {
      const url = selectedClass
        ? `/api/classes/${selectedClass.id_class}`
        : "/api/classes";
      const method = selectedClass ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка сохранения");
      }

      toast.success(selectedClass ? "Класс обновлён" : "Класс создан");
      setDialogOpen(false);
      fetchClasses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const confirmDelete = async () => {
    if (!selectedClass) return;

    try {
      const res = await fetch(`/api/classes/${selectedClass.id_class}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Ошибка удаления");

      toast.success("Класс удалён");
      setDeleteDialogOpen(false);
      fetchClasses();
    } catch {
      toast.error("Ошибка удаления класса");
    }
  };

  const getParentName = (mainClass: number | null) => {
    if (!mainClass) return null;
    const parent = classes.find((c) => c.id_class === mainClass);
    return parent?.name;
  };

  const columns = [
    {
      key: "id_class",
      header: "ID",
      className: "w-[80px]",
    },
    {
      key: "short_name",
      header: "Код",
      render: (item: ProductClass) => (
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
      key: "main_class",
      header: "Родительский класс",
      render: (item: ProductClass) => {
        const parentName = getParentName(item.main_class);
        return parentName ? (
          <Badge variant="secondary">
            <FolderTree className="mr-1 h-3 w-3" />
            {parentName}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
  ];

  return (
    <PageContainer
      title="Классы товаров"
      description="Иерархическая классификация товаров"
      actions={
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить класс
        </Button>
      }
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      ) : (
        <DataTable
          data={classes}
          columns={columns}
          getRowKey={(item) => item.id_class}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Классы не найдены"
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedClass ? "Редактировать класс" : "Новый класс"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Код (short_name) *</label>
              <Input
                placeholder="electronics"
                value={formData.short_name}
                onChange={(e) =>
                  setFormData({ ...formData, short_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Название *</label>
              <Input
                placeholder="Электроника"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Родительский класс</label>
              <Select
                value={formData.main_class?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    main_class: value === "none" ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите родительский класс" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Нет (корневой класс)</SelectItem>
                  {classes
                    .filter((c) => c.id_class !== selectedClass?.id_class)
                    .map((c) => (
                      <SelectItem key={c.id_class} value={c.id_class.toString()}>
                        {c.name}
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
              {selectedClass ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Удалить класс?"
        description={`Вы уверены, что хотите удалить класс "${selectedClass?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </PageContainer>
  );
}

