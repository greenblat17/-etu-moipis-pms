import { NextResponse } from "next/server";
import {
  getProductById,
  getProductParameters,
  upsertProductParameter,
  validateParamValue,
  getParameterConstraints,
} from "@/lib/db/queries/products";
import {
  updateProductParametersSchema,
  validateRequest,
} from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    const parameters = await getProductParameters(id);
    const constraints = await getParameterConstraints(id);
    
    return NextResponse.json({ parameters, constraints });
  } catch (error) {
    console.error("Error fetching product parameters:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки параметров товара" },
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

    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    const validation = validateRequest(updateProductParametersSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    // Валидируем все параметры перед сохранением
    const validationErrors: { id_par: number; error: string }[] = [];
    
    for (const param of validation.data.parameters) {
      const result = await validateParamValue(id, param.id_par, param.val);
      if (!result.is_valid) {
        validationErrors.push({
          id_par: param.id_par,
          error: result.error_message || "Некорректное значение",
        });
      }
    }

    // Если есть ошибки валидации — возвращаем их
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: "Ошибки валидации параметров",
          validation_errors: validationErrors 
        },
        { status: 422 }
      );
    }

    // Сохраняем параметры
    for (const param of validation.data.parameters) {
      await upsertProductParameter(
        id,
        param.id_par,
        param.val,
        param.note || null
      );
    }

    // Возвращаем обновлённые параметры
    const updatedParameters = await getProductParameters(id);
    return NextResponse.json({ parameters: updatedParameters });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23503") {
      return NextResponse.json(
        { error: "Указанный параметр не существует" },
        { status: 400 }
      );
    }
    console.error("Error updating product parameters:", error);
    return NextResponse.json(
      { error: "Ошибка обновления параметров товара" },
      { status: 500 }
    );
  }
}
