"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Clock } from "lucide-react";
import { toast } from "sonner";

interface ProcessData {
  id_process: number;
  product_name?: string;
  template_name?: string;
  current_state?: { state_name: string; state_sh_name?: string };
}

interface TrajectoryStep {
  num_pos: number;
  state_name: string;
  dec_name?: string;
  fio?: string;
  d_time: string;
}

interface Decision {
  id_dec: number;
  name: string;
}

export default function ProcessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [process, setProcess] = useState<ProcessData | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectoryStep[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<Decision | null>(null);

  const fetchData = async () => {
    const [pRes, tRes, dRes] = await Promise.all([
      fetch(`/api/processes/${id}`),
      fetch(`/api/processes/${id}/trajectory`),
      fetch(`/api/processes/${id}/decisions`),
    ]);

    if (!pRes.ok) {
      router.push("/processes");
      return;
    }

    setProcess(await pRes.json());
    setTrajectory(await tRes.json());
    setDecisions(await dRes.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDecision = async () => {
    if (!confirmDialog) return;

    const res = await fetch(`/api/processes/${id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_dec: confirmDialog.id_dec }),
    });

    if (res.ok) {
      const data = await res.json();
      toast.success(`Переход: ${data.new_state.state_name}`);
      setConfirmDialog(null);
      fetchData();
    } else {
      toast.error("Ошибка");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <PageContainer title="Загрузка...">
        <p className="text-muted-foreground">Загрузка...</p>
      </PageContainer>
    );
  }

  if (!process) return null;

  return (
    <PageContainer
      title={`Процесс #${process.id_process}`}
      description={process.template_name}
      actions={
        <Button variant="ghost" size="sm" onClick={() => router.push("/processes")}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Назад
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Current State */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Текущее состояние</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {process.current_state?.state_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Товар: {process.product_name}
                </p>
              </div>
              {decisions.length > 0 && (
                <div className="flex gap-2">
                  {decisions.map((d) => (
                    <Button
                      key={d.id_dec}
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDialog(d)}
                    >
                      {d.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trajectory */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Траектория
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trajectory.map((step, i) => (
                <div
                  key={step.num_pos}
                  className={`flex items-start gap-3 ${
                    i === trajectory.length - 1 ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                        i === trajectory.length - 1
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {step.num_pos}
                    </div>
                    {i < trajectory.length - 1 && (
                      <div className="w-px h-8 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="font-medium">{step.state_name}</p>
                    <p className="text-xs">
                      {formatDate(step.d_time)}
                      {step.dec_name && ` → ${step.dec_name}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Подтвердите действие</DialogTitle>
          </DialogHeader>
          <p className="py-4">Применить решение "{confirmDialog?.name}"?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Отмена
            </Button>
            <Button onClick={handleDecision}>Подтвердить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
