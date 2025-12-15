import { NextResponse } from "next/server";
import {
  getStateById,
  updateState,
  deleteState,
} from "@/lib/db/queries/states";
import { updateStateSchema, validateRequest } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const state = await getStateById(parseInt(id));

    if (!state) {
      return NextResponse.json(
        { error: "Состояние не найдено" },
        { status: 404 }
      );
    }

    return NextResponse.json(state);
  } catch (error) {
    console.error("Error fetching state:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки состояния" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = validateRequest(updateStateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    const updated = await updateState(parseInt(id), validation.data);

    if (!updated) {
      return NextResponse.json(
        { error: "Состояние не найдено" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json(
        { error: "Состояние с таким sh_name уже существует" },
        { status: 409 }
      );
    }
    console.error("Error updating state:", error);
    return NextResponse.json(
      { error: "Ошибка обновления состояния" },
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
    const deleted = await deleteState(parseInt(id));

    if (!deleted) {
      return NextResponse.json(
        { error: "Состояние не найдено" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23503") {
      return NextResponse.json(
        { error: "Нельзя удалить состояние, которое используется в шаблонах" },
        { status: 409 }
      );
    }
    console.error("Error deleting state:", error);
    return NextResponse.json(
      { error: "Ошибка удаления состояния" },
      { status: 500 }
    );
  }
}
