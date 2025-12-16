"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Trash2, GitBranch, Filter, Workflow } from "lucide-react";
import { toast } from "sonner";

interface TransitionFunction {
  id_f: number;
  name: string;
}

interface Predicate {
  id_pred: number;
  id_state: number | null;
  id_dec: number | null;
  yes_par: number | null;
  state_name?: string;
  dec_name?: string;
  par_name?: string;
}

interface FormulaEntry {
  id_f: number;
  num_dis: number;
  num_con: number;
  id_pred: number;
  func_name?: string;
  predicate_desc?: string;
}

interface State {
  id_state: number;
  name: string;
}

interface Decision {
  id_dec: number;
  name: string;
}

interface Parameter {
  id_par: number;
  name: string;
}

export default function DNFPage() {
  const [functions, setFunctions] = useState<TransitionFunction[]>([]);
  const [predicates, setPredicates] = useState<Predicate[]>([]);
  const [formulas, setFormulas] = useState<FormulaEntry[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<number | null>(null);

  // Справочники для создания предикатов
  const [states, setStates] = useState<State[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [parameters, setParameters] = useState<Parameter[]>([]);

  const [loading, setLoading] = useState(true);

  // Диалоги
  const [funcDialogOpen, setFuncDialogOpen] = useState(false);
  const [predDialogOpen, setPredDialogOpen] = useState(false);
  const [formulaDialogOpen, setFormulaDialogOpen] = useState(false);

  // Формы
  const [newFuncName, setNewFuncName] = useState("");
  const [newPredicate, setNewPredicate] = useState({
    type: "state" as "state" | "decision" | "parameter",
    value: "",
  });
  const [newFormula, setNewFormula] = useState({
    num_dis: 1,
    num_con: 1,
    id_pred: 0,
  });

  const fetchData = async () => {
    try {
      const [funcsRes, predsRes, statesRes, decsRes, parsRes] = await Promise.all([
        fetch("/api/dnf/functions"),
        fetch("/api/dnf/predicates"),
        fetch("/api/states"),
        fetch("/api/decisions"),
        fetch("/api/parameters"),
      ]);

      setFunctions(await funcsRes.json());
      setPredicates(await predsRes.json());
      setStates(await statesRes.json());
      setDecisions(await decsRes.json());
      setParameters(await parsRes.json());
    } catch {
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const fetchFormulas = async (funcId: number) => {
    try {
      const res = await fetch(`/api/dnf/formulas/${funcId}`);
      setFormulas(await res.json());
    } catch {
      toast.error("Ошибка загрузки формул");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedFunction) {
      fetchFormulas(selectedFunction);
    } else {
      setFormulas([]);
    }
  }, [selectedFunction]);

  // Создание функции
  const handleCreateFunction = async () => {
    if (!newFuncName.trim()) {
      toast.error("Введите название функции");
      return;
    }

    try {
      const res = await fetch("/api/dnf/functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFuncName }),
      });

      if (!res.ok) throw new Error();

      toast.success("Функция создана");
      setFuncDialogOpen(false);
      setNewFuncName("");
      fetchData();
    } catch {
      toast.error("Ошибка создания функции");
    }
  };

  // Создание предиката
  const handleCreatePredicate = async () => {
    if (!newPredicate.value) {
      toast.error("Выберите значение");
      return;
    }

    const body: Record<string, number | null> = {
      id_state: null,
      id_dec: null,
      yes_par: null,
    };

    if (newPredicate.type === "state") {
      body.id_state = parseInt(newPredicate.value);
    } else if (newPredicate.type === "decision") {
      body.id_dec = parseInt(newPredicate.value);
    } else {
      body.yes_par = parseInt(newPredicate.value);
    }

    try {
      const res = await fetch("/api/dnf/predicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      toast.success("Предикат создан");
      setPredDialogOpen(false);
      setNewPredicate({ type: "state", value: "" });
      fetchData();
    } catch {
      toast.error("Ошибка создания предиката");
    }
  };

  // Добавление в формулу
  const handleAddToFormula = async () => {
    if (!selectedFunction || !newFormula.id_pred) {
      toast.error("Выберите функцию и предикат");
      return;
    }

    try {
      const res = await fetch(`/api/dnf/formulas/${selectedFunction}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFormula),
      });

      if (!res.ok) throw new Error();

      toast.success("Добавлено в формулу");
      setFormulaDialogOpen(false);
      setNewFormula({ num_dis: 1, num_con: 1, id_pred: 0 });
      fetchFormulas(selectedFunction);
    } catch {
      toast.error("Ошибка добавления в формулу");
    }
  };

  // Удаление из формулы
  const handleDeleteFromFormula = async (entry: FormulaEntry) => {
    if (!selectedFunction) return;

    try {
      const res = await fetch(
        `/api/dnf/formulas/${selectedFunction}?num_dis=${entry.num_dis}&num_con=${entry.num_con}&id_pred=${entry.id_pred}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error();

      toast.success("Удалено из формулы");
      fetchFormulas(selectedFunction);
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  // Группировка формул по дизъюнкциям
  const groupedFormulas = formulas.reduce((acc, entry) => {
    if (!acc[entry.num_dis]) {
      acc[entry.num_dis] = [];
    }
    acc[entry.num_dis].push(entry);
    return acc;
  }, {} as Record<number, FormulaEntry[]>);

  const getPredicateDescription = (pred: Predicate) => {
    if (pred.state_name) return `Был в: ${pred.state_name}`;
    if (pred.dec_name) return `Решение: ${pred.dec_name}`;
    if (pred.par_name) return `Параметр: ${pred.par_name}`;
    return "Пустой предикат";
  };

  if (loading) {
    return (
      <PageContainer title="ДНФ-логика">
        <p className="text-muted-foreground">Загрузка...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="ДНФ-логика переходов"
      description="Управление условиями переходов между состояниями"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Функции переходов */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Workflow className="h-4 w-4" />
                Функции переходов
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setFuncDialogOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {functions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет функций</p>
            ) : (
              functions.map((func) => (
                <div
                  key={func.id_f}
                  className={`flex items-center justify-between rounded-md p-2 cursor-pointer transition-colors ${
                    selectedFunction === func.id_f
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => setSelectedFunction(func.id_f)}
                >
                  <span className="text-sm font-medium">{func.name}</span>
                  <Badge variant="secondary">#{func.id_f}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Предикаты */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" />
                Предикаты
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setPredDialogOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {predicates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет предикатов</p>
            ) : (
              predicates.map((pred) => (
                <div
                  key={pred.id_pred}
                  className="flex items-center justify-between rounded-md bg-muted/50 p-2"
                >
                  <div>
                    <p className="text-sm font-medium">P{pred.id_pred}</p>
                    <p className="text-xs text-muted-foreground">
                      {getPredicateDescription(pred)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Формула ДНФ */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <GitBranch className="h-4 w-4" />
                Формула ДНФ
              </CardTitle>
              {selectedFunction && (
                <Button size="sm" variant="outline" onClick={() => setFormulaDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedFunction ? (
              <p className="text-sm text-muted-foreground">Выберите функцию слева</p>
            ) : Object.keys(groupedFormulas).length === 0 ? (
              <p className="text-sm text-muted-foreground">Формула пуста (всегда true)</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedFormulas).map(([numDis, entries], idx) => (
                  <div key={numDis}>
                    {idx > 0 && (
                      <div className="my-2 text-center text-xs font-bold text-amber-500">OR</div>
                    )}
                    <div className="rounded-md border border-border p-2 space-y-1">
                      <p className="text-xs text-muted-foreground mb-2">Группа {numDis}</p>
                      {entries.map((entry, entryIdx) => (
                        <div key={`${entry.num_con}-${entry.id_pred}`}>
                          {entryIdx > 0 && (
                            <div className="text-center text-xs text-blue-500 my-1">AND</div>
                          )}
                          <div className="flex items-center justify-between bg-muted/50 rounded p-1.5">
                            <span className="text-sm">{entry.predicate_desc}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleDeleteFromFormula(entry)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Диалог создания функции */}
      <Dialog open={funcDialogOpen} onOpenChange={setFuncDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Новая функция перехода</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Название функции"
              value={newFuncName}
              onChange={(e) => setNewFuncName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFuncDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateFunction}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог создания предиката */}
      <Dialog open={predDialogOpen} onOpenChange={setPredDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Новый предикат</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select
              value={newPredicate.type}
              onValueChange={(v) =>
                setNewPredicate({ type: v as "state" | "decision" | "parameter", value: "" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Тип предиката" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="state">Был в состоянии</SelectItem>
                <SelectItem value="decision">Было решение</SelectItem>
                <SelectItem value="parameter">Параметр валиден</SelectItem>
              </SelectContent>
            </Select>

            {newPredicate.type === "state" && (
              <Select
                value={newPredicate.value}
                onValueChange={(v) => setNewPredicate({ ...newPredicate, value: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите состояние" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id_state} value={s.id_state.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {newPredicate.type === "decision" && (
              <Select
                value={newPredicate.value}
                onValueChange={(v) => setNewPredicate({ ...newPredicate, value: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите решение" />
                </SelectTrigger>
                <SelectContent>
                  {decisions.map((d) => (
                    <SelectItem key={d.id_dec} value={d.id_dec.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {newPredicate.type === "parameter" && (
              <Select
                value={newPredicate.value}
                onValueChange={(v) => setNewPredicate({ ...newPredicate, value: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите параметр" />
                </SelectTrigger>
                <SelectContent>
                  {parameters.map((p) => (
                    <SelectItem key={p.id_par} value={p.id_par.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPredDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreatePredicate}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог добавления в формулу */}
      <Dialog open={formulaDialogOpen} onOpenChange={setFormulaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить в формулу</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">OR-группа</label>
                <Input
                  type="number"
                  min={1}
                  value={newFormula.num_dis}
                  onChange={(e) =>
                    setNewFormula({ ...newFormula, num_dis: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">AND-номер</label>
                <Input
                  type="number"
                  min={1}
                  value={newFormula.num_con}
                  onChange={(e) =>
                    setNewFormula({ ...newFormula, num_con: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>

            <Select
              value={newFormula.id_pred ? newFormula.id_pred.toString() : ""}
              onValueChange={(v) => setNewFormula({ ...newFormula, id_pred: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите предикат" />
              </SelectTrigger>
              <SelectContent>
                {predicates.map((p) => (
                  <SelectItem key={p.id_pred} value={p.id_pred.toString()}>
                    P{p.id_pred}: {getPredicateDescription(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-xs text-muted-foreground">
              OR-группа = дизъюнкция, AND-номер = конъюнкция внутри группы.
              <br />
              Формула: (P₁ AND P₂) OR (P₃ AND P₄) ...
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormulaDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddToFormula}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

