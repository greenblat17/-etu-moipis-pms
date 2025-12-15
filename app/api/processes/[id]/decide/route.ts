import { NextResponse } from "next/server";
import {
  getProcessById,
  getCurrentState,
  getAvailableDecisions,
  makeDecision,
} from "@/lib/db/queries/processes";
import { getNextState } from "@/lib/db/transitions";
import { getStateById } from "@/lib/db/queries/states";
import { makeDecisionSchema, validateRequest } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const processId = parseInt(id);
    const body = await request.json();

    const validation = validateRequest(makeDecisionSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    // Проверяем процесс
    const process = await getProcessById(processId);
    if (!process) {
      return NextResponse.json({ error: "Процесс не найден" }, { status: 404 });
    }

    // Получаем текущее состояние
    const currentStep = await getCurrentState(processId);
    if (!currentStep) {
      return NextResponse.json({ error: "Траектория пуста" }, { status: 400 });
    }

    // Проверяем, что решение допустимо
    const availableDecisions = await getAvailableDecisions(processId);
    const isAllowed = availableDecisions.some(
      (d) => d.id_dec === validation.data.id_dec
    );
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Это решение недопустимо в текущем состоянии" },
        { status: 422 }
      );
    }

    // Определяем следующее состояние
    const nextStateId = getNextState(
      currentStep.id_state,
      validation.data.id_dec
    );
    if (!nextStateId) {
      return NextResponse.json(
        { error: "Переход для данного решения не определён" },
        { status: 422 }
      );
    }

    // Применяем решение
    const personId = validation.data.id_per || 1;
    await makeDecision(processId, validation.data.id_dec, personId, nextStateId);

    // Получаем информацию о новом состоянии
    const newState = await getStateById(nextStateId);

    return NextResponse.json({
      success: true,
      new_state: {
        id_state: nextStateId,
        state_name: newState?.name || "—",
      },
    });
  } catch (error) {
    console.error("Error making decision:", error);
    return NextResponse.json(
      { error: "Ошибка обработки решения" },
      { status: 500 }
    );
  }
}
