import { NextResponse } from "next/server";
import {
  getParameterById,
  updateParameter,
  deleteParameter,
} from "@/lib/db/queries/parameters";
import { updateParameterSchema, validateRequest } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parameter = await getParameterById(parseInt(id));

    if (!parameter) {
      return NextResponse.json(
        { error: "Параметр не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json(parameter);
  } catch (error) {
    console.error("Error fetching parameter:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки параметра" },
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

    const validation = validateRequest(updateParameterSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    const updated = await updateParameter(parseInt(id), validation.data);

    if (!updated) {
      return NextResponse.json(
        { error: "Параметр не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json(
        { error: "Параметр с таким именем уже существует" },
        { status: 409 }
      );
    }
    console.error("Error updating parameter:", error);
    return NextResponse.json(
      { error: "Ошибка обновления параметра" },
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
    const deleted = await deleteParameter(parseInt(id));

    if (!deleted) {
      return NextResponse.json(
        { error: "Параметр не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23503") {
      return NextResponse.json(
        { error: "Нельзя удалить параметр, который используется в товарах" },
        { status: 409 }
      );
    }
    console.error("Error deleting parameter:", error);
    return NextResponse.json(
      { error: "Ошибка удаления параметра" },
      { status: 500 }
    );
  }
}
