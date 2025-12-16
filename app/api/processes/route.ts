import { NextResponse } from "next/server";
import { getAllProcesses, createProcess } from "@/lib/db/queries/processes";
import { createProcessSchema, validateRequest } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("template_id");
    const productId = searchParams.get("product_id");

    const processes = await getAllProcesses({
      templateId: templateId ? parseInt(templateId) : undefined,
      productId: productId || undefined,
    });

    // Преобразуем в формат с current_state объектом
    const result = processes.map((p: any) => ({
      ...p,
      current_state: p.state_name ? {
        state_name: p.state_name,
        state_sh_name: p.state_sh_name,
      } : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching processes:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки процессов" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = validateRequest(createProcessSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    const result = await createProcess({
      type_pr: validation.data.type_pr,
      id_prod: validation.data.id_prod,
      id_per: validation.data.id_per || 1,
    });

    return NextResponse.json(
      {
        id_process: result.id_process,
        success: true,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message?.includes("No initial state")) {
      return NextResponse.json(
        { error: "В шаблоне не задано начальное состояние (flag_beg = 1)" },
        { status: 422 }
      );
    }
    const pgError = error as { code?: string };
    if (pgError.code === "23503") {
      return NextResponse.json(
        { error: "Указанный шаблон или товар не существует" },
        { status: 400 }
      );
    }
    console.error("Error creating process:", error);
    return NextResponse.json(
      { error: "Ошибка создания процесса" },
      { status: 500 }
    );
  }
}
