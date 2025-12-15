import { query, queryOne } from "../index";
import type { TypeDecision } from "@/lib/types";

export async function getAllDecisions(): Promise<TypeDecision[]> {
  return query<TypeDecision>(`
    SELECT id_dec, name, sh_name 
    FROM type_decision 
    ORDER BY id_dec
  `);
}

export async function getDecisionById(
  id: number
): Promise<TypeDecision | null> {
  return queryOne<TypeDecision>(
    `
    SELECT id_dec, name, sh_name 
    FROM type_decision 
    WHERE id_dec = $1
  `,
    [id]
  );
}

// Использование PostgreSQL функции ins_decision
export async function createDecision(data: {
  name: string;
  sh_name: string;
}): Promise<{ id_dec: number; o_res: number }> {
  const rows = await query<{ id_dec: number; o_res: number }>(
    `SELECT * FROM ins_decision($1, $2)`,
    [data.name, data.sh_name]
  );
  return rows[0];
}

export async function updateDecision(
  id: number,
  data: Partial<{
    name: string;
    sh_name: string;
  }>
): Promise<TypeDecision | null> {
  const rows = await query<TypeDecision>(
    `
    UPDATE type_decision 
    SET name = COALESCE($2, name),
        sh_name = COALESCE($3, sh_name)
    WHERE id_dec = $1
    RETURNING id_dec, name, sh_name
  `,
    [id, data.name, data.sh_name]
  );
  return rows[0] || null;
}

export async function deleteDecision(id: number): Promise<boolean> {
  const rows = await query(
    `DELETE FROM type_decision WHERE id_dec = $1 RETURNING id_dec`,
    [id]
  );
  return rows.length > 0;
}

// Предзаполненные решения из ТЗ
export const PRESET_DECISIONS = [
  { sh_name: "submit", name: "Отправить на модерацию" },
  { sh_name: "approve", name: "Одобрить" },
  { sh_name: "reject", name: "Отклонить" },
  { sh_name: "request_changes", name: "Запросить правки" },
  { sh_name: "apply_changes", name: "Внести правки" },
  { sh_name: "pause", name: "Приостановить" },
  { sh_name: "resume", name: "Возобновить" },
  { sh_name: "archive", name: "Архивировать" },
  { sh_name: "cancel", name: "Отменить" },
  { sh_name: "create_copy", name: "Создать копию" },
  { sh_name: "start_edit", name: "Начать редактирование" },
  { sh_name: "to_moderation", name: "Отправить на модерацию" },
  { sh_name: "revision", name: "На доработку" },
  { sh_name: "mod_approved", name: "Согласовано модератором" },
  { sh_name: "mgr_approved", name: "Согласовано руководителем" },
  { sh_name: "allow", name: "Разрешить ввод" },
  { sh_name: "postpone", name: "Отложить" },
  { sh_name: "retry", name: "Повторить" },
  { sh_name: "done", name: "Завершено" },
];

export async function seedPresetDecisions(): Promise<number> {
  let created = 0;
  for (const decision of PRESET_DECISIONS) {
    const result = await createDecision(decision);
    if (result.o_res === 1) created++;
  }
  return created;
}

