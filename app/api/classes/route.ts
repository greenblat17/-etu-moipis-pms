import { NextResponse } from "next/server";
import {
  getAllClasses,
  getClassTree,
  createClass,
} from "@/lib/db/queries/classes";
import { createClassSchema, validateRequest } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    if (format === "tree") {
      const tree = await getClassTree();
      return NextResponse.json(tree);
    }

    const classes = await getAllClasses();
    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки классов" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = validateRequest(createClassSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    const newClass = await createClass(validation.data);
    return NextResponse.json(newClass, { status: 201 });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json(
        { error: "Класс с таким именем уже существует" },
        { status: 409 }
      );
    }
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Ошибка создания класса" },
      { status: 500 }
    );
  }
}
