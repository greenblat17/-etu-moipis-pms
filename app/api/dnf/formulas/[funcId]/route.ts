import { NextResponse } from "next/server";
import { 
  getFormulasByFunction, 
  addFormulaEntry, 
  deleteFormulaEntry 
} from "@/lib/db/queries/dnf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ funcId: string }> }
) {
  try {
    const { funcId: funcIdStr } = await params;
    const funcId = parseInt(funcIdStr);
    const formulas = await getFormulasByFunction(funcId);
    return NextResponse.json(formulas);
  } catch (error) {
    console.error("Error fetching formulas:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки формул" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ funcId: string }> }
) {
  try {
    const { funcId: funcIdStr } = await params;
    const funcId = parseInt(funcIdStr);
    const body = await request.json();
    
    if (body.num_dis === undefined || body.num_con === undefined || !body.id_pred) {
      return NextResponse.json(
        { error: "Укажите num_dis, num_con и id_pred" },
        { status: 400 }
      );
    }

    const entry = await addFormulaEntry({
      id_f: funcId,
      num_dis: body.num_dis,
      num_con: body.num_con,
      id_pred: body.id_pred,
    });
    
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error adding formula entry:", error);
    return NextResponse.json(
      { error: "Ошибка добавления в формулу" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ funcId: string }> }
) {
  try {
    const { funcId: funcIdStr } = await params;
    const funcId = parseInt(funcIdStr);
    const { searchParams } = new URL(request.url);
    const numDis = parseInt(searchParams.get("num_dis") || "0");
    const numCon = parseInt(searchParams.get("num_con") || "0");
    const idPred = parseInt(searchParams.get("id_pred") || "0");

    const deleted = await deleteFormulaEntry(funcId, numDis, numCon, idPred);
    
    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Запись не найдена" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error deleting formula entry:", error);
    return NextResponse.json(
      { error: "Ошибка удаления из формулы" },
      { status: 500 }
    );
  }
}

