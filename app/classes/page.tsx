"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight, ChevronDown, Folder, FolderOpen, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import type { ChemClass, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ClassTreeNode extends ChemClass {
  children: ClassTreeNode[];
  parent_name?: string | null;
}

export default function ClassesPage() {
  const router = useRouter();
  const [tree, setTree] = useState<ClassTreeNode[]>([]);
  const [flatClasses, setFlatClasses] = useState<ChemClass[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ChemClass | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    sh_name: "",
    name: "",
    main_class: null as number | null,
  });

  const fetchClasses = async () => {
    try {
      const [treeRes, flatRes, productsRes] = await Promise.all([
        fetch("/api/classes?format=tree"),
        fetch("/api/classes"),
        fetch("/api/products"),
      ]);
      const [treeData, flatData, productsData] = await Promise.all([
        treeRes.json(),
        flatRes.json(),
        productsRes.json(),
      ]);
      setTree(treeData);
      setFlatClasses(flatData);
      setProducts(productsData);
      // Развернуть все узлы с детьми по умолчанию
      const withChildren = flatData
        .filter((c: ChemClass) => flatData.some((ch: ChemClass) => ch.main_class === c.id_class))
        .map((c: ChemClass) => c.id_class);
      setExpandedIds(new Set(withChildren));
    } catch {
      toast.error("Ошибка загрузки классов");
    } finally {
      setLoading(false);
    }
  };

  // Подсчёт товаров в классе (включая подклассы)
  const getProductCount = (classId: number): number => {
    const childIds = flatClasses
      .filter((c) => c.main_class === classId)
      .map((c) => c.id_class);
    
    const directCount = products.filter((p) => p.id_class === classId).length;
    const childCount = childIds.reduce((sum, id) => sum + getProductCount(id), 0);
    
    return directCount + childCount;
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreate = () => {
    setSelectedClass(null);
    setFormData({ sh_name: "", name: "", main_class: null });
    setDialogOpen(true);
  };

  const handleEdit = (item: ChemClass) => {
    setSelectedClass(item);
    setFormData({
      sh_name: item.sh_name,
      name: item.name,
      main_class: item.main_class,
    });
    setDialogOpen(true);
  };

  const handleDelete = (item: ChemClass) => {
    setSelectedClass(item);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.sh_name || !formData.name) {
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

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const TreeNode = ({ node, level = 0 }: { node: ClassTreeNode; level?: number }) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id_class);

    return (
      <div>
        <div
          className={cn(
            "group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent",
            level > 0 && "ml-6"
          )}
        >
          {/* Expand/Collapse button */}
          <button
            onClick={() => hasChildren && toggleExpand(node.id_class)}
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded",
              hasChildren ? "hover:bg-muted" : "invisible"
            )}
          >
            {hasChildren && (isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            ))}
          </button>

          {/* Folder icon */}
          {hasChildren && isExpanded ? (
            <FolderOpen className="h-4 w-4 text-amber-500" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}

          {/* Name - clickable to view products */}
          <button
            onClick={() => router.push(`/products?class_id=${node.id_class}`)}
            className="flex-1 text-left font-medium hover:text-primary hover:underline"
          >
            {node.name}
          </button>

          {/* Product count */}
          {(() => {
            const count = getProductCount(node.id_class);
            return count > 0 ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {count}
              </Badge>
            ) : null;
          })()}

          {/* Code */}
          <code className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {node.sh_name}
          </code>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleEdit(node)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => handleDelete(node)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="border-l border-border ml-[18px]">
            {node.children.map((child) => (
              <TreeNode key={child.id_class} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

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
      ) : tree.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">Классы не найдены</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-4">
          {tree.map((node) => (
            <TreeNode key={node.id_class} node={node} />
          ))}
        </div>
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
              <label className="text-sm font-medium">Код (sh_name) *</label>
              <Input
                placeholder="electronics"
                value={formData.sh_name}
                onChange={(e) =>
                  setFormData({ ...formData, sh_name: e.target.value })
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
                  <SelectItem value="none">— Корневой класс —</SelectItem>
                  {flatClasses
                    .filter((c) => c.id_class !== selectedClass?.id_class && !c.main_class)
                    .map((c) => (
                      <SelectItem key={c.id_class} value={c.id_class.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Подкатегории можно создавать только для корневых классов
              </p>
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

