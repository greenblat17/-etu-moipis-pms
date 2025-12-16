import { NextResponse } from "next/server";
import { getAllFunctions, createFunction } from "@/lib/db/queries/dnf";

export async function GET() {
  try {
    const functions = await getAllFunctions();
    return NextResponse.json(functions);
  } catch (error) {
    console.error("Error fetching functions:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки функций переходов" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { error: "Название функции обязательно" },
        { status: 400 }
      );
    }

    const newFunction = await createFunction({ name: body.name });
    return NextResponse.json(newFunction, { status: 201 });
  } catch (error) {
    console.error("Error creating function:", error);
    return NextResponse.json(
      { error: "Ошибка создания функции" },
      { status: 500 }
    );
  }
}

