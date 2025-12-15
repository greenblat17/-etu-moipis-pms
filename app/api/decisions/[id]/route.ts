import { NextResponse } from "next/server";
import {
  getDecisionById,
  updateDecision,
  deleteDecision,
} from "@/lib/db/queries/decisions";
import { updateDecisionSchema, validateRequest } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decision = await getDecisionById(parseInt(id));

    if (!decision) {
      return NextResponse.json({ error: "Решение не найдено" }, { status: 404 });
    }

    return NextResponse.json(decision);
  } catch (error) {
    console.error("Error fetching decision:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки решения" },
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

    const validation = validateRequest(updateDecisionSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    const updated = await updateDecision(parseInt(id), validation.data);

    if (!updated) {
      return NextResponse.json({ error: "Решение не найдено" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json(
        { error: "Решение с таким sh_name уже существует" },
        { status: 409 }
      );
    }
    console.error("Error updating decision:", error);
    return NextResponse.json(
      { error: "Ошибка обновления решения" },
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
    const deleted = await deleteDecision(parseInt(id));

    if (!deleted) {
      return NextResponse.json({ error: "Решение не найдено" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23503") {
      return NextResponse.json(
        { error: "Нельзя удалить решение, которое используется в шаблонах" },
        { status: 409 }
      );
    }
    console.error("Error deleting decision:", error);
    return NextResponse.json(
      { error: "Ошибка удаления решения" },
      { status: 500 }
    );
  }
}
