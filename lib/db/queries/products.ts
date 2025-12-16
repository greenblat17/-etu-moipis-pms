import { query, queryOne } from "../index";
import type { Product, ParProd } from "@/lib/types";

export async function getAllProducts(classId?: number): Promise<Product[]> {
  const baseQuery = `
    SELECT p.id_prod, p.name, p.id_class, c.name as class_name
    FROM prod p
    JOIN chem_class c ON c.id_class = p.id_class
  `;

  if (classId) {
    return query<Product>(
      baseQuery + ` WHERE p.id_class = $1 ORDER BY p.id_prod`,
      [classId]
    );
  }
  return query<Product>(baseQuery + ` ORDER BY p.id_prod`);
}

export async function getProductById(id: string): Promise<Product | null> {
  return queryOne<Product>(
    `
    SELECT p.id_prod, p.name, p.id_class, c.name as class_name
    FROM prod p
    JOIN chem_class c ON c.id_class = p.id_class
    WHERE p.id_prod = $1
  `,
    [id]
  );
}

export async function getProductParameters(
  productId: string
): Promise<ParProd[]> {
  return query<ParProd>(
    `
    SELECT pp.id_prod, pp.id_par, pp.val, pp.note,
           par.short_name as par_sh_name, par.name as par_name, par.type_par
    FROM par_prod pp
    JOIN parametr par ON par.id_par = pp.id_par
    WHERE pp.id_prod = $1
    ORDER BY pp.id_par
  `,
    [productId]
  );
}

export async function createProduct(data: {
  id_prod: string;
  name: string;
  id_class: number;
}): Promise<Product> {
  const rows = await query<Product>(
    `
    INSERT INTO prod (id_prod, name, id_class)
    VALUES ($1, $2, $3)
    RETURNING id_prod, name, id_class
  `,
    [data.id_prod, data.name, data.id_class]
  );
  return rows[0];
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    id_class: number;
  }>
): Promise<Product | null> {
  const rows = await query<Product>(
    `
    UPDATE prod 
    SET name = COALESCE($2, name),
        id_class = COALESCE($3, id_class)
    WHERE id_prod = $1
    RETURNING id_prod, name, id_class
  `,
    [id, data.name, data.id_class]
  );
  return rows[0] || null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const rows = await query(
    `
    DELETE FROM prod WHERE id_prod = $1 RETURNING id_prod
  `,
    [id]
  );
  return rows.length > 0;
}

// Валидация значения параметра
export async function validateParamValue(
  productId: string,
  parameterId: number,
  value: string | null
): Promise<{
  is_valid: boolean;
  error_message: string | null;
  min_val: string | null;
  max_val: string | null;
}> {
  if (!value) {
    return { is_valid: true, error_message: null, min_val: null, max_val: null };
  }

  const result = await queryOne<{
    is_valid: boolean;
    error_message: string | null;
    min_val: string | null;
    max_val: string | null;
  }>(
    `SELECT * FROM validate_param_value($1, $2, $3)`,
    [productId, parameterId, value]
  );

  return result || { is_valid: true, error_message: null, min_val: null, max_val: null };
}

// Получить ограничения параметров для класса товара
export async function getParameterConstraints(
  productId: string
): Promise<{
  id_par: number;
  par_name: string;
  min_val: string | null;
  max_val: string | null;
}[]> {
  return query(
    `
    SELECT pc.id_par, p.name as par_name, pc.min_val, pc.max_val
    FROM par_class pc
    JOIN parametr p ON p.id_par = pc.id_par
    JOIN prod pr ON pr.id_class = pc.id_class
    WHERE pr.id_prod = $1
    ORDER BY pc.id_par
    `,
    [productId]
  );
}

export async function upsertProductParameter(
  productId: string,
  parameterId: number,
  value: string | null,
  note: string | null
): Promise<ParProd> {
  const rows = await query<ParProd>(
    `
    INSERT INTO par_prod (id_prod, id_par, val, note)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id_prod, id_par) 
    DO UPDATE SET val = $3, note = $4
    RETURNING id_prod, id_par, val, note
  `,
    [productId, parameterId, value, note]
  );
  return rows[0];
}

export async function deleteProductParameter(
  productId: string,
  parameterId: number
): Promise<boolean> {
  const rows = await query(
    `
    DELETE FROM par_prod WHERE id_prod = $1 AND id_par = $2 RETURNING id_prod
  `,
    [productId, parameterId]
  );
  return rows.length > 0;
}

