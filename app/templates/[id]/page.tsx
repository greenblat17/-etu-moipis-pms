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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  FileText,
  CircleDot,
  GitBranch,
  Plus,
  Trash2,
  Star,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { ProcessTemplate, StateType, DecisionType, TemplateState } from "@/lib/types";

interface TemplateWithStates extends ProcessTemplate {
  states: (TemplateState & { decisions?: DecisionType[] })[];
}

export default function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateWithStates | null>(null);
  const [allStates, setAllStates] = useState<StateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [addStateDialogOpen, setAddStateDialogOpen] = useState(false);
  const [deleteStateDialogOpen, setDeleteStateDialogOpen] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [newStateId, setNewStateId] = useState<string>("");
  const [isInitial, setIsInitial] = useState(false);

  const fetchData = async () => {
    try {
      const [templateRes, statesRes] = await Promise.all([
        fetch(`/api/templates/${id}`),
        fetch("/api/states"),
      ]);

      if (!templateRes.ok) {
        toast.error("Шаблон не найден");
        router.push("/templates");
        return;
      }

      const [templateData, statesData] = await Promise.all([
        templateRes.json(),
        statesRes.json(),
      ]);

      setTemplate(templateData);
      setAllStates(statesData);
    } catch {
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddState = async () => {
    if (!newStateId) {
      toast.error("Выберите состояние");
      return;
    }

    try {
      const res = await fetch(`/api/templates/${id}/states`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_state: parseInt(newStateId),
          flag_beg: isInitial ? 1 : 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка добавления");
      }

      toast.success("Состояние добавлено");
      setAddStateDialogOpen(false);
      setNewStateId("");
      setIsInitial(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const handleSetInitial = async (stateId: number) => {
    try {
      const res = await fetch(`/api/templates/${id}/states/${stateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag_beg: 1 }),
      });

      if (!res.ok) throw new Error("Ошибка обновления");

      toast.success("Начальное состояние установлено");
      fetchData();
    } catch {
      toast.error("Ошибка обновления");
    }
  };

  const confirmDeleteState = async () => {
    if (!selectedStateId) return;

    try {
      const res = await fetch(`/api/templates/${id}/states/${selectedStateId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Ошибка удаления");

      toast.success("Состояние удалено");
      setDeleteStateDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const availableStates = allStates.filter(
    (s) => !template?.states?.find((ts) => ts.id_state === s.id_state)
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

  if (!template) return null;

  return (
    <PageContainer
      title={template.name}
      description={`Код: ${template.sh_name}`}
      actions={
        <Button variant="outline" onClick={() => router.push("/templates")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          К списку
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="font-medium">{template.id_type_proc}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Код</p>
              <code className="rounded bg-muted px-2 py-1 text-sm">
                {template.sh_name}
              </code>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Класс товаров</p>
              {template.class_name ? (
                <Badge variant="secondary">{template.class_name}</Badge>
              ) : (
                <span className="text-muted-foreground">Все классы</span>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Состояний</p>
              <p className="text-2xl font-bold">{template.states?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        {/* States Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CircleDot className="h-5 w-5" />
                  Состояния процесса
                </CardTitle>
                <CardDescription>
                  Определите состояния и переходы между ними
                </CardDescription>
              </div>
              <Button onClick={() => setAddStateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!template.states || template.states.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">
                  Состояния не добавлены
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Состояние</TableHead>
                    <TableHead>Доступные решения</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {template.states.map((state) => (
                    <TableRow key={state.id_state}>
                      <TableCell>
                        {state.flag_beg === 1 ? (
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleSetInitial(state.id_state)}
                            title="Сделать начальным"
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CircleDot className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{state.state_name}</p>
                            <code className="text-xs text-muted-foreground">
                              {state.state_sh_name}
                            </code>
                          </div>
                          {state.flag_beg === 1 && (
                            <Badge variant="outline" className="ml-2">
                              Начальное
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {state.decisions && state.decisions.length > 0 ? (
                            state.decisions.map((d) => (
                              <Badge key={d.id_dec} variant="secondary" className="text-xs">
                                <GitBranch className="mr-1 h-3 w-3" />
                                {d.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Нет решений
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedStateId(state.id_state);
                            setDeleteStateDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visual Flow */}
      {template.states && template.states.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Граф состояний</CardTitle>
            <CardDescription>
              Визуализация переходов (упрощённая)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              {template.states
                .sort((a, b) => (b.flag_beg || 0) - (a.flag_beg || 0))
                .map((state, index) => (
                  <div key={state.id_state} className="flex items-center gap-2">
                    <div
                      className={`rounded-lg border-2 px-4 py-2 ${
                        state.flag_beg === 1
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-border"
                      }`}
                    >
                      <p className="font-medium">{state.state_name}</p>
                    </div>
                    {index < template.states.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add State Dialog */}
      <Dialog open={addStateDialogOpen} onOpenChange={setAddStateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить состояние</DialogTitle>
            <DialogDescription>
              Выберите состояние из справочника
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Состояние *</label>
              <Select value={newStateId} onValueChange={setNewStateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите состояние" />
                </SelectTrigger>
                <SelectContent>
                  {availableStates.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Все состояния уже добавлены
                    </SelectItem>
                  ) : (
                    availableStates.map((s) => (
                      <SelectItem key={s.id_state} value={s.id_state.toString()}>
                        {s.name} ({s.sh_name})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isInitial"
                checked={isInitial}
                onChange={(e) => setIsInitial(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="isInitial" className="text-sm">
                Начальное состояние (flag_beg = 1)
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddState} disabled={!newStateId}>
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete State Confirmation */}
      <ConfirmDialog
        open={deleteStateDialogOpen}
        onOpenChange={setDeleteStateDialogOpen}
        title="Удалить состояние?"
        description="Состояние будет удалено из шаблона. Это действие нельзя отменить."
        confirmText="Удалить"
        variant="destructive"
        onConfirm={confirmDeleteState}
      />
    </PageContainer>
  );
}

