import { NextResponse } from "next/server";
import { getAllPredicates, createPredicate } from "@/lib/db/queries/dnf";

export async function GET() {
  try {
    const predicates = await getAllPredicates();
    return NextResponse.json(predicates);
  } catch (error) {
    console.error("Error fetching predicates:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки предикатов" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Хотя бы одно поле должно быть заполнено
    if (!body.id_state && !body.id_dec && !body.yes_par) {
      return NextResponse.json(
        { error: "Укажите хотя бы одно условие: состояние, решение или параметр" },
        { status: 400 }
      );
    }

    const newPredicate = await createPredicate({
      id_state: body.id_state || null,
      id_dec: body.id_dec || null,
      yes_par: body.yes_par || null,
    });
    
    return NextResponse.json(newPredicate, { status: 201 });
  } catch (error) {
    console.error("Error creating predicate:", error);
    return NextResponse.json(
      { error: "Ошибка создания предиката" },
      { status: 500 }
    );
  }
}

