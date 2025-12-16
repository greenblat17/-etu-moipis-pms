import { NextResponse } from "next/server";
import { auth, checkStateAccess } from "@/lib/auth";
import { getProcessById, getCurrentState } from "@/lib/db/queries/processes";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ hasAccess: false, reason: "Не авторизован" });
    }

    const { id } = await params;
    const processId = parseInt(id);
    const userId = parseInt(session.user.id);

    const process = await getProcessById(processId);
    if (!process) {
      return NextResponse.json({ hasAccess: false, reason: "Процесс не найден" });
    }

    const currentStep = await getCurrentState(processId);
    if (!currentStep) {
      return NextResponse.json({ hasAccess: false, reason: "Нет состояния" });
    }

    const hasAccess = await checkStateAccess(
      userId,
      process.type_pr,
      currentStep.id_state
    );

    return NextResponse.json({
      hasAccess,
      reason: hasAccess ? null : "Нет прав для этого состояния",
    });
  } catch (error) {
    console.error("Error checking access:", error);
    return NextResponse.json({ hasAccess: false, reason: "Ошибка" });
  }
}

