import { NextResponse } from "next/server";
import { getAllTemplates, createTemplate } from "@/lib/db/queries/templates";
import { createTemplateSchema, validateRequest } from "@/lib/validators";

export async function GET() {
  try {
    const templates = await getAllTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки шаблонов" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = validateRequest(createTemplateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    const result = await createTemplate(validation.data);

    if (result.o_res === 0) {
      return NextResponse.json(
        {
          error: "Шаблон с таким sh_name уже существует",
          id_type_proc: result.id_type_proc,
        },
        { status: 409 }
      );
    }

    const newTemplate = {
      id_type_proc: result.id_type_proc,
      ...validation.data,
    };

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23503") {
      return NextResponse.json(
        { error: "Указанный класс не существует" },
        { status: 400 }
      );
    }
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Ошибка создания шаблона" },
      { status: 500 }
    );
  }
}
