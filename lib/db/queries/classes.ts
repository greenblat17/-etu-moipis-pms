import { query, queryOne } from "../index";
import type { ChemClass } from "@/lib/types";

export async function getAllClasses(): Promise<ChemClass[]> {
  return query<ChemClass>(`
    SELECT c.id_class, c.short_name AS sh_name, c.name, c.main_class,
           p.name AS parent_name
    FROM chem_class c
    LEFT JOIN chem_class p ON p.id_class = c.main_class
    ORDER BY COALESCE(c.main_class, c.id_class), c.main_class NULLS FIRST, c.id_class
  `);
}

// Получить классы в виде дерева
export interface ClassTreeNode extends ChemClass {
  children: ClassTreeNode[];
}

export async function getClassTree(): Promise<ClassTreeNode[]> {
  const allClasses = await getAllClasses();
  
  // Строим дерево
  const map = new Map<number, ClassTreeNode>();
  const roots: ClassTreeNode[] = [];
  
  // Создаём узлы
  for (const cls of allClasses) {
    map.set(cls.id_class, { ...cls, children: [] });
  }
  
  // Связываем родителей и детей
  for (const cls of allClasses) {
    const node = map.get(cls.id_class)!;
    if (cls.main_class && map.has(cls.main_class)) {
      map.get(cls.main_class)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  
  return roots;
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

