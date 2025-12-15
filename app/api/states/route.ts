import { NextResponse } from "next/server";
import {
  getAllStates,
  createState,
  seedPresetStates,
} from "@/lib/db/queries/states";
import { createStateSchema, validateRequest } from "@/lib/validators";

export async function GET() {
  try {
    const states = await getAllStates();
    return NextResponse.json(states);
  } catch (error) {
    console.error("Error fetching states:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки состояний" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Специальный endpoint для загрузки предустановленных данных
    if (body.seed === true) {
      const created = await seedPresetStates();
      return NextResponse.json({
        success: true,
        message: `Создано ${created} новых состояний`,
      });
    }

    const validation = validateRequest(createStateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    const result = await createState(validation.data);

    if (result.o_res === 0) {
      return NextResponse.json(
        { error: "Состояние с таким sh_name уже существует", id_state: result.id_state },
        { status: 409 }
      );
    }

    const newState = {
      id_state: result.id_state,
      ...validation.data,
    };

    return NextResponse.json(newState, { status: 201 });
  } catch (error) {
    console.error("Error creating state:", error);
    return NextResponse.json(
      { error: "Ошибка создания состояния" },
      { status: 500 }
    );
  }
}
