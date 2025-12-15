"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Package,
  Settings,
  Play,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Product, Parameter, ParameterValue } from "@/lib/types";

interface ProductWithParams extends Product {
  parameters: (ParameterValue & { parameter?: Parameter })[];
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<ProductWithParams | null>(null);
  const [allParameters, setAllParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedParams, setEditedParams] = useState<
    { id_par: number; val: string; note: string }[]
  >([]);

  const fetchData = async () => {
    try {
      const [productRes, paramsRes] = await Promise.all([
        fetch(`/api/products/${id}`),
        fetch("/api/parameters"),
      ]);

      if (!productRes.ok) {
        toast.error("Товар не найден");
        router.push("/products");
        return;
      }

      const [productData, paramsData] = await Promise.all([
        productRes.json(),
        paramsRes.json(),
      ]);

      setProduct(productData);
      setAllParameters(paramsData);
      setEditedParams(
        productData.parameters?.map((p: ParameterValue) => ({
          id_par: p.id_par,
          val: p.val || "",
          note: p.note || "",
        })) || []
      );
    } catch {
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleParamChange = (id_par: number, field: "val" | "note", value: string) => {
    setEditedParams((prev) =>
      prev.map((p) => (p.id_par === id_par ? { ...p, [field]: value } : p))
    );
  };

  const handleAddParam = (id_par: number) => {
    if (editedParams.find((p) => p.id_par === id_par)) {
      toast.error("Параметр уже добавлен");
      return;
    }
    setEditedParams((prev) => [...prev, { id_par, val: "", note: "" }]);
  };

  const handleRemoveParam = (id_par: number) => {
    setEditedParams((prev) => prev.filter((p) => p.id_par !== id_par));
  };

  const handleSaveParams = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${id}/parameters`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parameters: editedParams }),
      });

      if (!res.ok) throw new Error("Ошибка сохранения");

      toast.success("Параметры сохранены");
      fetchData();
    } catch {
      toast.error("Ошибка сохранения параметров");
    } finally {
      setSaving(false);
    }
  };

  const availableParams = allParameters.filter(
    (p) => !editedParams.find((ep) => ep.id_par === p.id_par)
  );

  if (loading) {
    return (
      <PageContainer title="Загрузка..." description="">
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </PageContainer>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <PageContainer
      title={product.name}
      description={`Артикул: ${product.id_prod}`}
      actions={
        <Button variant="outline" onClick={() => router.push("/products")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          К списку
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Артикул</p>
              <code className="rounded bg-muted px-2 py-1 text-sm font-medium">
                {product.id_prod}
              </code>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Название</p>
              <p className="font-medium">{product.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Класс товара</p>
              <Badge variant="secondary">{product.class_name}</Badge>
            </div>
            <div className="pt-4">
              <Button className="w-full" variant="outline">
                <Play className="mr-2 h-4 w-4" />
                Запустить процесс
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Parameters */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Параметры
                </CardTitle>
                <CardDescription>
                  Характеристики товара
                </CardDescription>
              </div>
              <Button onClick={handleSaveParams} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="values">
              <TabsList>
                <TabsTrigger value="values">Значения</TabsTrigger>
                <TabsTrigger value="add">Добавить</TabsTrigger>
              </TabsList>

              <TabsContent value="values" className="mt-4">
                {editedParams.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                    <p className="text-muted-foreground">
                      Параметры не заданы. Перейдите на вкладку "Добавить"
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Параметр</TableHead>
                        <TableHead>Значение</TableHead>
                        <TableHead>Примечание</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editedParams.map((param) => {
                        const paramInfo = allParameters.find(
                          (p) => p.id_par === param.id_par
                        );
                        return (
                          <TableRow key={param.id_par}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{paramInfo?.name}</p>
                                <code className="text-xs text-muted-foreground">
                                  {paramInfo?.short_name}
                                </code>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={param.val}
                                onChange={(e) =>
                                  handleParamChange(
                                    param.id_par,
                                    "val",
                                    e.target.value
                                  )
                                }
                                placeholder="Значение"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={param.note}
                                onChange={(e) =>
                                  handleParamChange(
                                    param.id_par,
                                    "note",
                                    e.target.value
                                  )
                                }
                                placeholder="Примечание"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveParam(param.id_par)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="add" className="mt-4">
                {availableParams.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                    <p className="text-muted-foreground">
                      Все параметры уже добавлены
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {availableParams.map((param) => (
                      <Button
                        key={param.id_par}
                        variant="outline"
                        className="justify-start"
                        onClick={() => handleAddParam(param.id_par)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {param.name}
                        <Badge variant="secondary" className="ml-auto">
                          {param.type_par}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

