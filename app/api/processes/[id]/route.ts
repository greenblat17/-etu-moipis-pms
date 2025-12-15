import { NextResponse } from "next/server";
import {
  getProcessById,
  deleteProcess,
  getCurrentState,
} from "@/lib/db/queries/processes";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const processId = parseInt(id);

    const process = await getProcessById(processId);
    if (!process) {
      return NextResponse.json({ error: "Процесс не найден" }, { status: 404 });
    }

    // Получаем текущее состояние
    const currentState = await getCurrentState(processId);

    return NextResponse.json({
      ...process,
      current_state: currentState,
    });
  } catch (error) {
    console.error("Error fetching process:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки процесса" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteProcess(parseInt(id));

    if (!deleted) {
      return NextResponse.json({ error: "Процесс не найден" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting process:", error);
    return NextResponse.json(
      { error: "Ошибка удаления процесса" },
      { status: 500 }
    );
  }
}
