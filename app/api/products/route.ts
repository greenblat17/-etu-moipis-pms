import { NextResponse } from "next/server";
import { getAllProducts, createProduct } from "@/lib/db/queries/products";
import { createProductSchema, validateRequest } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("class_id");

    const products = await getAllProducts(
      classId ? parseInt(classId) : undefined
    );
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки товаров" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = validateRequest(createProductSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    const newProduct = await createProduct(validation.data);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json(
        { error: "Товар с таким ID уже существует" },
        { status: 409 }
      );
    }
    if (pgError.code === "23503") {
      return NextResponse.json(
        { error: "Указанный класс не существует" },
        { status: 400 }
      );
    }
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Ошибка создания товара" },
      { status: 500 }
    );
  }
}
