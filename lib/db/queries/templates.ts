import { query, queryOne } from "../index";
import type { TypeProcess, State, DecisionMap } from "@/lib/types";

export async function getAllTemplates(): Promise<TypeProcess[]> {
  return query<TypeProcess>(`
    SELECT tp.id_type_proc, tp.name, tp.sh_name, tp.id_class,
           c.name as class_name
    FROM type_process tp
    LEFT JOIN chem_class c ON c.id_class = tp.id_class
    ORDER BY tp.id_type_proc
  `);
}

export async function getTemplateById(
  id: number
): Promise<TypeProcess | null> {
  return queryOne<TypeProcess>(
    `
    SELECT tp.id_type_proc, tp.name, tp.sh_name, tp.id_class,
           c.name as class_name
    FROM type_process tp
    LEFT JOIN chem_class c ON c.id_class = tp.id_class
    WHERE tp.id_type_proc = $1
  `,
    [id]
  );
}

export async function getTemplateStates(templateId: number): Promise<State[]> {
  return query<State>(
    `
    SELECT s.id_type_pr, s.id_state, s.flag_beg, s.id_f,
           ts.name as state_name, ts.sh_name as state_sh_name
    FROM state s
    JOIN type_state ts ON ts.id_state = s.id_state
    WHERE s.id_type_pr = $1
    ORDER BY s.flag_beg DESC, s.id_state
  `,
    [templateId]
  );
}

export async function getStateDecisions(
  templateId: number,
  stateId: number
): Promise<DecisionMap[]> {
  return query<DecisionMap>(
    `
    SELECT dm.id_type_proc, dm.id_state, dm.id_dec,
           td.name as dec_name, td.sh_name as dec_sh_name
    FROM decision_map dm
    JOIN type_decision td ON td.id_dec = dm.id_dec
    WHERE dm.id_type_proc = $1 AND dm.id_state = $2
    ORDER BY dm.id_dec
  `,
    [templateId, stateId]
  );
}

// Использование PostgreSQL функции ins_type_process
export async function createTemplate(data: {
  name: string;
  sh_name: string;
  id_class?: number | null;
}): Promise<{ id_type_proc: number; o_res: number }> {
  const rows = await query<{ id_type_proc: number; o_res: number }>(
    `SELECT * FROM ins_type_process($1, $2, $3)`,
    [data.name, data.sh_name, data.id_class || null]
  );
  return rows[0];
}

export async function updateTemplate(
  id: number,
  data: Partial<{
    name: string;
    sh_name: string;
    id_class: number | null;
  }>
): Promise<TypeProcess | null> {
  const rows = await query<TypeProcess>(
    `
    UPDATE type_process 
    SET name = COALESCE($2, name),
        sh_name = COALESCE($3, sh_name),
        id_class = COALESCE($4, id_class)
    WHERE id_type_proc = $1
    RETURNING id_type_proc, name, sh_name, id_class
  `,
    [id, data.name, data.sh_name, data.id_class]
  );
  return rows[0] || null;
}

export async function deleteTemplate(id: number): Promise<boolean> {
  const rows = await query(
    `DELETE FROM type_process WHERE id_type_proc = $1 RETURNING id_type_proc`,
    [id]
  );
  return rows.length > 0;
}

// Использование PostgreSQL функции ins_state
export async function addStateToTemplate(
  templateId: number,
  stateId: number,
  flagBeg: number = 0
): Promise<number> {
  const rows = await query<{ ins_state: number }>(
    `SELECT ins_state($1, $2, $3)`,
    [templateId, stateId, flagBeg]
  );
  return rows[0].ins_state;
}

export async function updateTemplateState(
  templateId: number,
  stateId: number,
  flagBeg: number
): Promise<boolean> {
  const rows = await query(
    `
    UPDATE state 
    SET flag_beg = $3
    WHERE id_type_pr = $1 AND id_state = $2
    RETURNING id_type_pr
  `,
    [templateId, stateId, flagBeg]
  );
  return rows.length > 0;
}

export async function removeStateFromTemplate(
  templateId: number,
  stateId: number
): Promise<boolean> {
  const rows = await query(
    `
    DELETE FROM state 
    WHERE id_type_pr = $1 AND id_state = $2 
    RETURNING id_type_pr
  `,
    [templateId, stateId]
  );
  return rows.length > 0;
}

// Использование PostgreSQL функции ins_decision_map
export async function addDecisionToState(
  templateId: number,
  stateId: number,
  decisionId: number
): Promise<number> {
  const rows = await query<{ ins_decision_map: number }>(
    `SELECT ins_decision_map($1, $2, $3)`,
    [templateId, stateId, decisionId]
  );
  return rows[0].ins_decision_map;
}

export async function removeDecisionFromState(
  templateId: number,
  stateId: number,
  decisionId: number
): Promise<boolean> {
  const rows = await query(
    `
    DELETE FROM decision_map 
    WHERE id_type_proc = $1 AND id_state = $2 AND id_dec = $3
    RETURNING id_type_proc
  `,
    [templateId, stateId, decisionId]
  );
  return rows.length > 0;
}

