import { NextResponse } from "next/server";
import {
  getTemplateById,
  getTemplateStates,
  getStateDecisions,
  updateTemplate,
  deleteTemplate,
} from "@/lib/db/queries/templates";
import { updateTemplateSchema, validateRequest } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templateId = parseInt(id);

    const template = await getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
    }

    // Получаем состояния шаблона
    const states = await getTemplateStates(templateId);

    // Для каждого состояния получаем доступные решения
    const statesWithDecisions = await Promise.all(
      states.map(async (state) => {
        const decisions = await getStateDecisions(templateId, state.id_state);
        return {
          ...state,
          decisions,
        };
      })
    );

    return NextResponse.json({
      ...template,
      states: statesWithDecisions,
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки шаблона" },
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

    const validation = validateRequest(updateTemplateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    const updated = await updateTemplate(parseInt(id), validation.data);

    if (!updated) {
      return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json(
        { error: "Шаблон с таким sh_name уже существует" },
        { status: 409 }
      );
    }
    if (pgError.code === "23503") {
      return NextResponse.json(
        { error: "Указанный класс не существует" },
        { status: 400 }
      );
    }
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Ошибка обновления шаблона" },
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
    const deleted = await deleteTemplate(parseInt(id));

    if (!deleted) {
      return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23503") {
      return NextResponse.json(
        { error: "Нельзя удалить шаблон, по которому запущены процессы" },
        { status: 409 }
      );
    }
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Ошибка удаления шаблона" },
      { status: 500 }
    );
  }
}
