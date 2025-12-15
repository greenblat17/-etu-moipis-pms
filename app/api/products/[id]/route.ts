import { NextResponse } from "next/server";
import {
  getProductById,
  updateProduct,
  deleteProduct,
  getProductParameters,
} from "@/lib/db/queries/products";
import { updateProductSchema, validateRequest } from "@/lib/validators";

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

    // Получаем параметры товара
    const parameters = await getProductParameters(id);

    return NextResponse.json({
      ...product,
      parameters,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки товара" },
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

    const validation = validateRequest(updateProductSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    const updated = await updateProduct(id, validation.data);

    if (!updated) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23503") {
      return NextResponse.json(
        { error: "Указанный класс не существует" },
        { status: 400 }
      );
    }
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Ошибка обновления товара" },
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
    const deleted = await deleteProduct(id);

    if (!deleted) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23503") {
      return NextResponse.json(
        { error: "Нельзя удалить товар, для которого запущены процессы" },
        { status: 409 }
      );
    }
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Ошибка удаления товара" },
      { status: 500 }
    );
  }
}
