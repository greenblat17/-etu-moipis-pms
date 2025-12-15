import { NextResponse } from "next/server";
import { getProcessById, getTrajectory } from "@/lib/db/queries/processes";

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

    const trajectory = await getTrajectory(processId);
    return NextResponse.json(trajectory);
  } catch (error) {
    console.error("Error fetching trajectory:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки траектории" },
      { status: 500 }
    );
  }
}
