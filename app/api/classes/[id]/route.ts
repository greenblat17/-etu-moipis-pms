import { NextResponse } from "next/server";
import {
  getClassById,
  updateClass,
  deleteClass,
} from "@/lib/db/queries/classes";
import { updateClassSchema, validateRequest } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const classItem = await getClassById(parseInt(id));

    if (!classItem) {
      return NextResponse.json({ error: "Класс не найден" }, { status: 404 });
    }

    return NextResponse.json(classItem);
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки класса" },
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

    const validation = validateRequest(updateClassSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    const updated = await updateClass(parseInt(id), validation.data);

    if (!updated) {
      return NextResponse.json({ error: "Класс не найден" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json(
        { error: "Класс с таким именем уже существует" },
        { status: 409 }
      );
    }
    console.error("Error updating class:", error);
    return NextResponse.json(
      { error: "Ошибка обновления класса" },
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
    const deleted = await deleteClass(parseInt(id));

    if (!deleted) {
      return NextResponse.json({ error: "Класс не найден" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23503") {
      return NextResponse.json(
        { error: "Нельзя удалить класс, к которому привязаны товары" },
        { status: 409 }
      );
    }
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: "Ошибка удаления класса" },
      { status: 500 }
    );
  }
}
