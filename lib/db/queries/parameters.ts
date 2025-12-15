import { query, queryOne } from "../index";
import type { Parametr } from "@/lib/types";

export async function getAllParameters(): Promise<Parametr[]> {
  return query<Parametr>(`
    SELECT id_par, short_name AS sh_name, name, type_par 
    FROM parametr 
    ORDER BY id_par
  `);
}

export async function getParameterById(id: number): Promise<Parametr | null> {
  return queryOne<Parametr>(
    `
    SELECT id_par, short_name AS sh_name, name, type_par 
    FROM parametr 
    WHERE id_par = $1
  `,
    [id]
  );
}

export async function createParameter(data: {
  sh_name: string;
  name: string;
  type_par: string;
}): Promise<Parametr> {
  const rows = await query<Parametr>(
    `
    INSERT INTO parametr (short_name, name, type_par)
    VALUES ($1, $2, $3)
    RETURNING id_par, short_name AS sh_name, name, type_par
  `,
    [data.sh_name, data.name, data.type_par]
  );
  return rows[0];
}

export async function updateParameter(
  id: number,
  data: Partial<{
    sh_name: string;
    name: string;
    type_par: string;
  }>
): Promise<Parametr | null> {
  const rows = await query<Parametr>(
    `
    UPDATE parametr 
    SET short_name = COALESCE($2, short_name),
        name = COALESCE($3, name),
        type_par = COALESCE($4, type_par)
    WHERE id_par = $1
    RETURNING id_par, short_name AS sh_name, name, type_par
  `,
    [id, data.sh_name, data.name, data.type_par]
  );
  return rows[0] || null;
}

export async function deleteParameter(id: number): Promise<boolean> {
  const rows = await query(
    `
    DELETE FROM parametr WHERE id_par = $1 RETURNING id_par
  `,
    [id]
  );
  return rows.length > 0;
}

