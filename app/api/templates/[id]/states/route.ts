import { NextResponse } from "next/server";
import {
  getTemplateById,
  getTemplateStates,
  addStateToTemplate,
} from "@/lib/db/queries/templates";
import { addStateToTemplateSchema, validateRequest } from "@/lib/validators";

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

    const states = await getTemplateStates(templateId);
    return NextResponse.json(states);
  } catch (error) {
    console.error("Error fetching template states:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки состояний шаблона" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templateId = parseInt(id);
    const body = await request.json();

    const template = await getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
    }

    const validation = validateRequest(addStateToTemplateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    await addStateToTemplate(
      templateId,
      validation.data.id_state,
      validation.data.flag_beg
    );

    // Возвращаем обновлённый список состояний
    const states = await getTemplateStates(templateId);
    return NextResponse.json(states, { status: 201 });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23503") {
      return NextResponse.json(
        { error: "Указанное состояние не существует" },
        { status: 400 }
      );
    }
    if (pgError.code === "23505") {
      return NextResponse.json(
        { error: "Это состояние уже добавлено в шаблон" },
        { status: 409 }
      );
    }
    console.error("Error adding state to template:", error);
    return NextResponse.json(
      { error: "Ошибка добавления состояния в шаблон" },
      { status: 500 }
    );
  }
}
