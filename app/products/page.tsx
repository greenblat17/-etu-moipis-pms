"use client";

import { useEffect, useState } from "react";
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
import type { Product, ProductClass } from "@/lib/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [classes, setClasses] = useState<ProductClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    id_prod: "",
    name: "",
    id_class: 0,
  });

  const fetchData = async () => {
    try {
      const [productsRes, classesRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/classes"),
      ]);
      setProducts(await productsRes.json());
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
      title="Товары"
      actions={
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Добавить
        </Button>
      }
    >
      {loading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Артикул</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Класс</TableHead>
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
                {classes.map((c) => (
                  <SelectItem key={c.id_class} value={c.id_class.toString()}>
                    {c.name}
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
