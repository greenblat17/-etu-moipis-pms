import { query, queryOne } from "../index";
import type { TypeState } from "@/lib/types";

export async function getAllStates(): Promise<TypeState[]> {
  return query<TypeState>(`
    SELECT id_state, name, sh_name 
    FROM type_state 
    ORDER BY id_state
  `);
}

export async function getStateById(id: number): Promise<TypeState | null> {
  return queryOne<TypeState>(
    `
    SELECT id_state, name, sh_name 
    FROM type_state 
    WHERE id_state = $1
  `,
    [id]
  );
}

// Использование PostgreSQL функции ins_type_state
export async function createState(data: {
  name: string;
  sh_name: string;
}): Promise<{ id_state: number; o_res: number }> {
  const rows = await query<{ id_state: number; o_res: number }>(
    `SELECT * FROM ins_type_state($1, $2)`,
    [data.name, data.sh_name]
  );
  return rows[0];
}

export async function updateState(
  id: number,
  data: Partial<{
    name: string;
    sh_name: string;
  }>
): Promise<TypeState | null> {
  const rows = await query<TypeState>(
    `
    UPDATE type_state 
    SET name = COALESCE($2, name),
        sh_name = COALESCE($3, sh_name)
    WHERE id_state = $1
    RETURNING id_state, name, sh_name
  `,
    [id, data.name, data.sh_name]
  );
  return rows[0] || null;
}

export async function deleteState(id: number): Promise<boolean> {
  const rows = await query(
    `DELETE FROM type_state WHERE id_state = $1 RETURNING id_state`,
    [id]
  );
  return rows.length > 0;
}

// Предзаполненные состояния из ТЗ
export const PRESET_STATES = [
  // Process 1: Включение товара
  { sh_name: "draft", name: "Черновик карточки" },
  { sh_name: "moderation", name: "На модерации" },
  { sh_name: "published", name: "Опубликован" },
  { sh_name: "corrections", name: "Запрошены правки" },
  { sh_name: "rejected", name: "Отклонён" },
  { sh_name: "paused", name: "Приостановлен" },
  { sh_name: "cancelled", name: "Отменён" },
  { sh_name: "archived", name: "Архив" },
  // Process 2: Управление изменениями
  { sh_name: "select_product", name: "Выбор товара" },
  { sh_name: "create_copy", name: "Создание копии" },
  { sh_name: "edit_params", name: "Редактирование параметров" },
  { sh_name: "mod_approval", name: "Согласование модератором" },
  { sh_name: "mgr_approval", name: "Согласование руководителем" },
  { sh_name: "change_permission", name: "Разрешение на ввод изменений" },
  { sh_name: "apply_changes", name: "Ввод изменений в действие" },
  { sh_name: "postponed", name: "Изменение отложено" },
  { sh_name: "completed", name: "Изменение введено" },
];

export async function seedPresetStates(): Promise<number> {
  let created = 0;
  for (const state of PRESET_STATES) {
    const result = await createState(state);
    if (result.o_res === 1) created++;
  }
  return created;
}

