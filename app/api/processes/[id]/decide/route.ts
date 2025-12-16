import { NextResponse } from "next/server";
import {
  getProcessById,
  getCurrentState,
  getAvailableDecisions,
  makeDecision,
  getNextStateFromDb,
} from "@/lib/db/queries/processes";
import { getStateById } from "@/lib/db/queries/states";
import { canTransition } from "@/lib/db/queries/dnf";
import { makeDecisionSchema, validateRequest } from "@/lib/validators";
import { auth, checkStateAccess } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверяем авторизацию
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
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

    // Проверяем права доступа к текущему состоянию
    const hasAccess = await checkStateAccess(
      userId,
      process.type_pr,
      currentStep.id_state
    );
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Нет прав для работы с этим состоянием" },
        { status: 403 }
      );
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

    // Определяем следующее состояние из БД
    const nextStateId = await getNextStateFromDb(
      process.type_pr,
      currentStep.id_state,
      validation.data.id_dec
    );
    if (!nextStateId) {
      return NextResponse.json(
        { error: "Переход для данного решения не определён" },
        { status: 422 }
      );
    }

    // Проверяем ДНФ-условие перехода (если задано)
    const dnfCheck = await canTransition(
      process.type_pr,
      currentStep.id_state,
      processId,
      process.id_prod
    );
    if (!dnfCheck.allowed) {
      return NextResponse.json(
        { error: dnfCheck.reason || "Условие перехода не выполнено" },
        { status: 422 }
      );
    }

    // Применяем решение (используем ID текущего пользователя)
    await makeDecision(processId, validation.data.id_dec, userId, nextStateId);

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
