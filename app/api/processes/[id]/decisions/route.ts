import { NextResponse } from "next/server";
import {
  getProcessById,
  getAvailableDecisions,
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

    const decisions = await getAvailableDecisions(processId);
    return NextResponse.json(decisions);
  } catch (error) {
    console.error("Error fetching available decisions:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки доступных решений" },
      { status: 500 }
    );
  }
}
