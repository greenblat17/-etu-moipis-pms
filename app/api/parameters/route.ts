import { NextResponse } from "next/server";
import {
  getAllParameters,
  createParameter,
} from "@/lib/db/queries/parameters";
import { createParameterSchema, validateRequest } from "@/lib/validators";

export async function GET() {
  try {
    const parameters = await getAllParameters();
    return NextResponse.json(parameters);
  } catch (error) {
    console.error("Error fetching parameters:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки параметров" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = validateRequest(createParameterSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    const newParameter = await createParameter(validation.data);
    return NextResponse.json(newParameter, { status: 201 });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json(
        { error: "Параметр с таким именем уже существует" },
        { status: 409 }
      );
    }
    console.error("Error creating parameter:", error);
    return NextResponse.json(
      { error: "Ошибка создания параметра" },
      { status: 500 }
    );
  }
}
