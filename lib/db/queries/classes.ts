import { query, queryOne } from "../index";
import type { ChemClass } from "@/lib/types";

export async function getAllClasses(): Promise<ChemClass[]> {
  return query<ChemClass>(`
    SELECT id_class, short_name AS sh_name, name, main_class 
    FROM chem_class 
    ORDER BY id_class
  `);
}

export async function getClassById(id: number): Promise<ChemClass | null> {
  return queryOne<ChemClass>(
    `
    SELECT id_class, short_name AS sh_name, name, main_class 
    FROM chem_class 
    WHERE id_class = $1
  `,
    [id]
  );
}

export async function getClassChildren(parentId: number): Promise<ChemClass[]> {
  return query<ChemClass>(
    `
    SELECT id_class, short_name AS sh_name, name, main_class 
    FROM chem_class 
    WHERE main_class = $1
    ORDER BY id_class
  `,
    [parentId]
  );
}

export async function createClass(data: {
  sh_name: string;
  name: string;
  main_class?: number | null;
}): Promise<ChemClass> {
  const rows = await query<ChemClass>(
    `
    INSERT INTO chem_class (short_name, name, main_class)
    VALUES ($1, $2, $3)
    RETURNING id_class, short_name AS sh_name, name, main_class
  `,
    [data.sh_name, data.name, data.main_class || null]
  );
  return rows[0];
}

export async function updateClass(
  id: number,
  data: {
    sh_name?: string;
    name?: string;
    main_class?: number | null;
  }
): Promise<ChemClass | null> {
  const rows = await query<ChemClass>(
    `
    UPDATE chem_class 
    SET short_name = COALESCE($2, short_name),
        name = COALESCE($3, name),
        main_class = COALESCE($4, main_class)
    WHERE id_class = $1
    RETURNING id_class, short_name AS sh_name, name, main_class
  `,
    [id, data.sh_name, data.name, data.main_class]
  );
  return rows[0] || null;
}

export async function deleteClass(id: number): Promise<boolean> {
  const rows = await query(
    `
    DELETE FROM chem_class WHERE id_class = $1 RETURNING id_class
  `,
    [id]
  );
  return rows.length > 0;
}

