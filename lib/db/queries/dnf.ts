import { query, queryOne } from "../index";

// ====== Функции переходов ======

export interface TransitionFunction {
  id_f: number;
  name: string;
}

export async function getAllFunctions(): Promise<TransitionFunction[]> {
  return query<TransitionFunction>(`
    SELECT id_f, name FROM funct ORDER BY id_f
  `);
}

export async function getFunctionById(id: number): Promise<TransitionFunction | null> {
  return queryOne<TransitionFunction>(
    `SELECT id_f, name FROM funct WHERE id_f = $1`,
    [id]
  );
}

export async function createFunction(data: { name: string }): Promise<TransitionFunction> {
  const maxId = await queryOne<{ max_id: number }>(
    `SELECT COALESCE(MAX(id_f), 0) as max_id FROM funct`
  );
  const newId = (maxId?.max_id || 0) + 1;
  
  const rows = await query<TransitionFunction>(
    `INSERT INTO funct (id_f, name) VALUES ($1, $2) RETURNING id_f, name`,
    [newId, data.name]
  );
  return rows[0];
}

export async function deleteFunction(id: number): Promise<boolean> {
  const rows = await query(
    `DELETE FROM funct WHERE id_f = $1 RETURNING id_f`,
    [id]
  );
  return rows.length > 0;
}

// ====== Предикаты ======

export interface Predicate {
  id_pred: number;
  id_state: number | null;
  id_dec: number | null;
  yes_par: number | null;
  // Для отображения
  state_name?: string;
  dec_name?: string;
  par_name?: string;
}

export async function getAllPredicates(): Promise<Predicate[]> {
  return query<Predicate>(`
    SELECT p.id_pred, p.id_state, p.id_dec, p.yes_par,
           ts.name as state_name,
           td.name as dec_name,
           par.name as par_name
    FROM predicat p
    LEFT JOIN type_state ts ON ts.id_state = p.id_state
    LEFT JOIN type_decision td ON td.id_dec = p.id_dec
    LEFT JOIN parametr par ON par.id_par = p.yes_par
    ORDER BY p.id_pred
  `);
}

export async function getPredicateById(id: number): Promise<Predicate | null> {
  return queryOne<Predicate>(
    `SELECT id_pred, id_state, id_dec, yes_par FROM predicat WHERE id_pred = $1`,
    [id]
  );
}

export async function createPredicate(data: {
  id_state?: number | null;
  id_dec?: number | null;
  yes_par?: number | null;
}): Promise<Predicate> {
  const maxId = await queryOne<{ max_id: number }>(
    `SELECT COALESCE(MAX(id_pred), 0) as max_id FROM predicat`
  );
  const newId = (maxId?.max_id || 0) + 1;
  
  const rows = await query<Predicate>(
    `INSERT INTO predicat (id_pred, id_state, id_dec, yes_par) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id_pred, id_state, id_dec, yes_par`,
    [newId, data.id_state || null, data.id_dec || null, data.yes_par || null]
  );
  return rows[0];
}

export async function deletePredicate(id: number): Promise<boolean> {
  const rows = await query(
    `DELETE FROM predicat WHERE id_pred = $1 RETURNING id_pred`,
    [id]
  );
  return rows.length > 0;
}

// ====== Формулы (ДНФ) ======

export interface FormulaEntry {
  id_f: number;
  num_dis: number;
  num_con: number;
  id_pred: number;
  // Для отображения
  func_name?: string;
  predicate_desc?: string;
}

export async function getFormulasByFunction(funcId: number): Promise<FormulaEntry[]> {
  return query<FormulaEntry>(`
    SELECT f.id_f, f.num_dis, f.num_con, f.id_pred,
           fn.name as func_name,
           CASE 
             WHEN p.id_state IS NOT NULL THEN 'Был в состоянии: ' || ts.name
             WHEN p.id_dec IS NOT NULL THEN 'Было решение: ' || td.name
             WHEN p.yes_par IS NOT NULL THEN 'Параметр валиден: ' || par.name
             ELSE 'Пустой предикат'
           END as predicate_desc
    FROM formula f
    JOIN funct fn ON fn.id_f = f.id_f
    JOIN predicat p ON p.id_pred = f.id_pred
    LEFT JOIN type_state ts ON ts.id_state = p.id_state
    LEFT JOIN type_decision td ON td.id_dec = p.id_dec
    LEFT JOIN parametr par ON par.id_par = p.yes_par
    WHERE f.id_f = $1
    ORDER BY f.num_dis, f.num_con
  `,
    [funcId]
  );
}

export async function addFormulaEntry(data: {
  id_f: number;
  num_dis: number;
  num_con: number;
  id_pred: number;
}): Promise<FormulaEntry> {
  const rows = await query<FormulaEntry>(
    `INSERT INTO formula (id_f, num_dis, num_con, id_pred) 
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id_f, num_dis, num_con, id_pred) DO NOTHING
     RETURNING id_f, num_dis, num_con, id_pred`,
    [data.id_f, data.num_dis, data.num_con, data.id_pred]
  );
  return rows[0];
}

export async function deleteFormulaEntry(
  id_f: number,
  num_dis: number,
  num_con: number,
  id_pred: number
): Promise<boolean> {
  const rows = await query(
    `DELETE FROM formula 
     WHERE id_f = $1 AND num_dis = $2 AND num_con = $3 AND id_pred = $4
     RETURNING id_f`,
    [id_f, num_dis, num_con, id_pred]
  );
  return rows.length > 0;
}

// ====== Вычисление ДНФ-формулы ======

/**
 * Проверяет, выполнен ли предикат для данного процесса
 */
async function evaluatePredicate(
  predicate: Predicate,
  processId: number,
  productId: string
): Promise<boolean> {
  // Предикат по состоянию: был ли процесс в этом состоянии?
  if (predicate.id_state !== null) {
    const wasInState = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM trajctory 
       WHERE id_process = $1 AND id_state = $2`,
      [processId, predicate.id_state]
    );
    return (wasInState?.count || 0) > 0;
  }

  // Предикат по решению: было ли это решение?
  if (predicate.id_dec !== null) {
    const hadDecision = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM trajctory 
       WHERE id_process = $1 AND id_dec = $2`,
      [processId, predicate.id_dec]
    );
    return (hadDecision?.count || 0) > 0;
  }

  // Предикат по параметру: валиден ли параметр товара?
  if (predicate.yes_par !== null) {
    const paramValue = await queryOne<{ val: string }>(
      `SELECT val FROM par_prod WHERE id_prod = $1 AND id_par = $2`,
      [productId, predicate.yes_par]
    );
    
    if (!paramValue?.val) return false;
    
    // Проверяем валидность через функцию validate_param_value
    const validation = await queryOne<{ is_valid: boolean }>(
      `SELECT is_valid FROM validate_param_value($1, $2, $3)`,
      [productId, predicate.yes_par, paramValue.val]
    );
    
    return validation?.is_valid ?? false;
  }

  // Пустой предикат всегда истинен
  return true;
}

/**
 * Вычисляет ДНФ-формулу для функции перехода
 * ДНФ = (P1 AND P2 AND ...) OR (P3 AND P4 AND ...) OR ...
 * 
 * num_dis - номер дизъюнкции (OR-группы)
 * num_con - номер конъюнкции внутри группы (AND внутри OR)
 */
export async function evaluateDNF(
  funcId: number,
  processId: number,
  productId: string
): Promise<boolean> {
  // Получаем все записи формулы
  const formulaEntries = await query<{
    num_dis: number;
    num_con: number;
    id_pred: number;
  }>(
    `SELECT num_dis, num_con, id_pred FROM formula WHERE id_f = $1 ORDER BY num_dis, num_con`,
    [funcId]
  );

  if (formulaEntries.length === 0) {
    // Если формула пустая, переход разрешён
    return true;
  }

  // Группируем по num_dis (дизъюнкциям)
  const disjunctions = new Map<number, number[]>();
  for (const entry of formulaEntries) {
    if (!disjunctions.has(entry.num_dis)) {
      disjunctions.set(entry.num_dis, []);
    }
    disjunctions.get(entry.num_dis)!.push(entry.id_pred);
  }

  // ДНФ: хотя бы одна дизъюнкция должна быть истинной
  for (const [, predicateIds] of disjunctions) {
    // Конъюнкция: все предикаты в группе должны быть истинны
    let conjunctionTrue = true;
    
    for (const predId of predicateIds) {
      const predicate = await getPredicateById(predId);
      if (!predicate) {
        conjunctionTrue = false;
        break;
      }
      
      const result = await evaluatePredicate(predicate, processId, productId);
      if (!result) {
        conjunctionTrue = false;
        break;
      }
    }
    
    if (conjunctionTrue) {
      return true; // Одна дизъюнкция истинна => вся ДНФ истинна
    }
  }

  return false; // Ни одна дизъюнкция не истинна
}

/**
 * Проверяет, можно ли совершить переход из текущего состояния
 * с учётом ДНФ-логики (если задана)
 */
export async function canTransition(
  templateId: number,
  stateId: number,
  processId: number,
  productId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Получаем id_f для состояния
  const stateInfo = await queryOne<{ id_f: number | null }>(
    `SELECT id_f FROM state WHERE id_type_pr = $1 AND id_state = $2`,
    [templateId, stateId]
  );

  if (!stateInfo) {
    return { allowed: false, reason: "Состояние не найдено в шаблоне" };
  }

  // Если функция перехода не задана, переход разрешён
  if (!stateInfo.id_f) {
    return { allowed: true };
  }

  // Вычисляем ДНФ-формулу
  const dnfResult = await evaluateDNF(stateInfo.id_f, processId, productId);
  
  if (dnfResult) {
    return { allowed: true };
  } else {
    return { 
      allowed: false, 
      reason: "Условие перехода (ДНФ-формула) не выполнено" 
    };
  }
}

