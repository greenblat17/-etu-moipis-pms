import { query, queryOne } from "../index";
import type { Process, TrajectoryStep } from "@/lib/types";

export async function getAllProcesses(filters?: {
  templateId?: number;
  productId?: string;
}): Promise<Process[]> {
  let sql = `
    SELECT p.id_process, p.name, p.sh_name, p.id_prod, p.type_pr,
           pr.name as product_name,
           tp.name as template_name,
           ts.name as state_name,
           ts.sh_name as state_sh_name
    FROM process p
    JOIN prod pr ON pr.id_prod = p.id_prod
    JOIN type_process tp ON tp.id_type_proc = p.type_pr
    LEFT JOIN LATERAL (
      SELECT id_state FROM trajctory t 
      WHERE t.id_process = p.id_process 
      ORDER BY num_pos DESC LIMIT 1
    ) curr ON true
    LEFT JOIN type_state ts ON ts.id_state = curr.id_state
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.templateId) {
    params.push(filters.templateId);
    sql += ` AND p.type_pr = $${params.length}`;
  }
  if (filters?.productId) {
    params.push(filters.productId);
    sql += ` AND p.id_prod = $${params.length}`;
  }

  sql += ` ORDER BY p.id_process DESC`;

  return query<Process>(sql, params);
}

export async function getProcessById(id: number): Promise<Process | null> {
  return queryOne<Process>(
    `
    SELECT p.id_process, p.name, p.sh_name, p.id_prod, p.type_pr,
           pr.name as product_name, c.name as class_name,
           tp.name as template_name, tp.sh_name as template_sh_name
    FROM process p
    JOIN prod pr ON pr.id_prod = p.id_prod
    JOIN chem_class c ON c.id_class = pr.id_class
    JOIN type_process tp ON tp.id_type_proc = p.type_pr
    WHERE p.id_process = $1
  `,
    [id]
  );
}

// Использование PostgreSQL функции read_trajectory с дополнением sh_name
export async function getTrajectory(
  processId: number
): Promise<(TrajectoryStep & { state_sh_name?: string })[]> {
  return query<TrajectoryStep & { state_sh_name?: string }>(
    `
    SELECT rt.*, ts.sh_name as state_sh_name
    FROM read_trajectory($1) rt
    JOIN type_state ts ON ts.id_state = rt.id_state
    ORDER BY rt.num_pos
    `,
    [processId]
  );
}

export async function getCurrentState(
  processId: number
): Promise<(TrajectoryStep & { state_sh_name?: string }) | null> {
  return queryOne<TrajectoryStep & { state_sh_name?: string }>(
    `
    SELECT rt.*, ts.sh_name as state_sh_name
    FROM read_trajectory($1) rt
    JOIN type_state ts ON ts.id_state = rt.id_state
    ORDER BY rt.num_pos DESC 
    LIMIT 1
    `,
    [processId]
  );
}

// Использование PostgreSQL функции ins_process
export async function createProcess(data: {
  type_pr: number;
  id_prod: string;
  id_per: number;
}): Promise<{ id_process: number; o_res: number }> {
  const rows = await query<{ id_process: number; o_res: number }>(
    `SELECT * FROM ins_process($1, $2, $3)`,
    [data.type_pr, data.id_prod, data.id_per]
  );
  return rows[0];
}

export async function deleteProcess(id: number): Promise<boolean> {
  const rows = await query(
    `DELETE FROM process WHERE id_process = $1 RETURNING id_process`,
    [id]
  );
  return rows.length > 0;
}

// Получить доступные решения для текущего состояния
export async function getAvailableDecisions(
  processId: number
): Promise<{ id_dec: number; name: string; sh_name: string }[]> {
  return query(
    `
    WITH current AS (
      SELECT p.type_pr, t.id_state
      FROM process p
      JOIN trajctory t ON t.id_process = p.id_process
      WHERE p.id_process = $1
      ORDER BY t.num_pos DESC
      LIMIT 1
    )
    SELECT td.id_dec, td.name, td.sh_name
    FROM decision_map dm
    JOIN current c ON dm.id_type_proc = c.type_pr AND dm.id_state = c.id_state
    JOIN type_decision td ON td.id_dec = dm.id_dec
    ORDER BY td.id_dec
  `,
    [processId]
  );
}

// Получить следующее состояние из БД
export async function getNextStateFromDb(
  templateId: number,
  currentStateId: number,
  decisionId: number
): Promise<number | null> {
  const row = await queryOne<{ next_state: number }>(
    `SELECT next_state FROM decision_map 
     WHERE id_type_proc = $1 AND id_state = $2 AND id_dec = $3`,
    [templateId, currentStateId, decisionId]
  );
  return row?.next_state || null;
}

// Принять решение (добавить шаг в траекторию)
export async function makeDecision(
  processId: number,
  decisionId: number,
  personId: number,
  nextStateId: number
): Promise<TrajectoryStep> {
  // Получаем следующий num_pos
  const maxPos = await queryOne<{ max_pos: number }>(
    `SELECT COALESCE(MAX(num_pos), 0) as max_pos FROM trajctory WHERE id_process = $1`,
    [processId]
  );

  const nextPos = (maxPos?.max_pos || 0) + 1;

  // Обновляем предыдущий шаг (добавляем решение)
  await query(
    `UPDATE trajctory SET id_dec = $2 WHERE id_process = $1 AND num_pos = $3`,
    [processId, decisionId, nextPos - 1]
  );

  // Добавляем новый шаг
  const rows = await query<TrajectoryStep>(
    `
    INSERT INTO trajctory (id_process, num_pos, id_state, id_dec, id_per)
    VALUES ($1, $2, $3, NULL, $4)
    RETURNING num_pos, id_state, id_dec, id_per, d_time
  `,
    [processId, nextPos, nextStateId, personId]
  );

  return rows[0];
}

