"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Product, ChemClass } from "@/lib/types";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const classIdParam = searchParams.get("class_id");
  const filterClassId = classIdParam ? parseInt(classIdParam) : null;

  const [products, setProducts] = useState<Product[]>([]);
  const [allClasses, setAllClasses] = useState<ChemClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    id_prod: "",
    name: "",
    id_class: 0,
  });

  const fetchData = async () => {
    try {
      const url = filterClassId 
        ? `/api/products?class_id=${filterClassId}` 
        : "/api/products";
      const [productsRes, classesRes] = await Promise.all([
        fetch(url),
        fetch("/api/classes"),
      ]);
      setProducts(await productsRes.json());
      setAllClasses(await classesRes.json());
    } catch {
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterClassId]);

  const filterClassName = filterClassId 
    ? allClasses.find(c => c.id_class === filterClassId)?.name 
    : null;

  const clearFilter = () => {
    router.push("/products");
  };

  // Только "листовые" классы для выбора
  const leafClasses = allClasses.filter(
    (c) => !allClasses.some((child) => child.main_class === c.id_class)
  );

  const handleSubmit = async () => {
    if (!formData.id_prod || !formData.name || !formData.id_class) {
      toast.error("Заполните все поля");
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();

      toast.success("Товар создан");
      setDialogOpen(false);
      setFormData({ id_prod: "", name: "", id_class: 0 });
      fetchData();
    } catch {
      toast.error("Ошибка создания");
    }
  };

  return (
    <PageContainer
      title={filterClassName ? `Товары: ${filterClassName}` : "Товары"}
      description={filterClassName ? undefined : "Все товары в системе"}
      actions={
        <div className="flex gap-2">
          {filterClassId && (
            <Button size="sm" variant="outline" onClick={clearFilter}>
              <X className="mr-1 h-4 w-4" />
              Сбросить фильтр
            </Button>
          )}
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Добавить
          </Button>
        </div>
      }
    >
      {loading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : products.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">
            {filterClassId ? "В этом классе нет товаров" : "Товары не найдены"}
          </p>
          {filterClassId && (
            <Button variant="link" onClick={clearFilter}>
              Показать все товары
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Артикул</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Класс</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id_prod}>
                <TableCell className="font-mono text-sm">{p.id_prod}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {p.class_name}
                </TableCell>
                <TableCell>
                  <Link href={`/products/${p.id_prod}`}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Новый товар</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Input
              placeholder="Артикул (PROD-001)"
              value={formData.id_prod}
              onChange={(e) =>
                setFormData({ ...formData, id_prod: e.target.value })
              }
            />
            <Input
              placeholder="Название"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <Select
              value={formData.id_class ? formData.id_class.toString() : ""}
              onValueChange={(v) =>
                setFormData({ ...formData, id_class: parseInt(v) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Класс товара" />
              </SelectTrigger>
              <SelectContent>
                {leafClasses.map((c) => (
                  <SelectItem key={c.id_class} value={c.id_class.toString()}>
                    {c.parent_name ? `${c.parent_name} → ${c.name}` : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
