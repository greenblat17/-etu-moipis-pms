import { NextResponse } from "next/server";
import {
  getTemplateById,
  updateTemplateState,
  removeStateFromTemplate,
  getStateDecisions,
} from "@/lib/db/queries/templates";
import { updateTemplateStateSchema, validateRequest } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; stateId: string }> }
) {
  try {
    const { id, stateId } = await params;
    const templateId = parseInt(id);
    const stateIdNum = parseInt(stateId);

    const template = await getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
    }

    const decisions = await getStateDecisions(templateId, stateIdNum);
    return NextResponse.json(decisions);
  } catch (error) {
    console.error("Error fetching state decisions:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки решений состояния" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; stateId: string }> }
) {
  try {
    const { id, stateId } = await params;
    const templateId = parseInt(id);
    const stateIdNum = parseInt(stateId);
    const body = await request.json();

    const template = await getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
    }

    const validation = validateRequest(updateTemplateStateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    const updated = await updateTemplateState(
      templateId,
      stateIdNum,
      validation.data.flag_beg
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Состояние не найдено в шаблоне" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating template state:", error);
    return NextResponse.json(
      { error: "Ошибка обновления состояния" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; stateId: string }> }
) {
  try {
    const { id, stateId } = await params;
    const templateId = parseInt(id);
    const stateIdNum = parseInt(stateId);

    const template = await getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
    }

    const deleted = await removeStateFromTemplate(templateId, stateIdNum);

    if (!deleted) {
      return NextResponse.json(
        { error: "Состояние не найдено в шаблоне" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23503") {
      return NextResponse.json(
        {
          error:
            "Нельзя удалить состояние, которое используется в траекториях процессов",
        },
        { status: 409 }
      );
    }
    console.error("Error removing state from template:", error);
    return NextResponse.json(
      { error: "Ошибка удаления состояния из шаблона" },
      { status: 500 }
    );
  }
}
