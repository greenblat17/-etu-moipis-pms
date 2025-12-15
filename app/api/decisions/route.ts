import { NextResponse } from "next/server";
import {
  getAllDecisions,
  createDecision,
  seedPresetDecisions,
} from "@/lib/db/queries/decisions";
import { createDecisionSchema, validateRequest } from "@/lib/validators";

export async function GET() {
  try {
    const decisions = await getAllDecisions();
    return NextResponse.json(decisions);
  } catch (error) {
    console.error("Error fetching decisions:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки решений" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Специальный endpoint для загрузки предустановленных данных
    if (body.seed === true) {
      const created = await seedPresetDecisions();
      return NextResponse.json({
        success: true,
        message: `Создано ${created} новых решений`,
      });
    }

    const validation = validateRequest(createDecisionSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    const result = await createDecision(validation.data);

    if (result.o_res === 0) {
      return NextResponse.json(
        { error: "Решение с таким sh_name уже существует", id_dec: result.id_dec },
        { status: 409 }
      );
    }

    const newDecision = {
      id_dec: result.id_dec,
      ...validation.data,
    };

    return NextResponse.json(newDecision, { status: 201 });
  } catch (error) {
    console.error("Error creating decision:", error);
    return NextResponse.json(
      { error: "Ошибка создания решения" },
      { status: 500 }
    );
  }
}
