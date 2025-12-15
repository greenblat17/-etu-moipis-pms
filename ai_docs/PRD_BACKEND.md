# PRD: Backend — Подсистема управления процессами маркетплейса

## Обзор проекта

**Название**: Process Management System (PMS)  
**Стек**: Next.js 15 (App Router), TypeScript, PostgreSQL  
**ORM**: Prisma или pg (node-postgres)  
**Архитектура**: API Routes + Server Actions  
**Текущее состояние**: Фронтенд готов с mock-данными, нужна интеграция с PostgreSQL

---

## Цели

1. Заменить mock-данные на реальную базу PostgreSQL
2. Интегрировать существующие PostgreSQL функции (`ins_process`, `read_trajectory` и др.)
3. Сохранить совместимость с текущим фронтендом
4. Добавить валидацию и обработку ошибок

---

## Текущая архитектура (mock)

```
app/
├── api/
│   ├── classes/
│   │   ├── route.ts           # GET, POST (mock)
│   │   └── [id]/route.ts      # GET, PUT, DELETE (mock)
│   ├── parameters/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── products/
│   │   ├── route.ts
│   │   └── [id]/
│   │       ├── route.ts
│   │       └── parameters/route.ts
│   ├── states/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── decisions/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── templates/
│   │   ├── route.ts
│   │   └── [id]/
│   │       ├── route.ts
│   │       └── states/
│   │           ├── route.ts
│   │           └── [stateId]/route.ts
│   └── processes/
│       ├── route.ts
│       └── [id]/
│           ├── route.ts
│           ├── trajectory/route.ts
│           ├── decisions/route.ts
│           └── decide/route.ts
│
└── lib/
    └── mock-data.ts           # ← Заменить на PostgreSQL
```

---

## Целевая архитектура

```
app/
├── api/                       # API Routes (без изменений в путях)
│   └── ...
│
lib/
├── db/
│   ├── index.ts               # PostgreSQL connection pool
│   ├── queries/               # SQL запросы
│   │   ├── classes.ts
│   │   ├── parameters.ts
│   │   ├── products.ts
│   │   ├── states.ts
│   │   ├── decisions.ts
│   │   ├── templates.ts
│   │   └── processes.ts
│   └── functions.ts           # Вызовы PostgreSQL функций
│
├── types.ts                   # TypeScript типы (уже есть)
├── api.ts                     # API клиент (уже есть)
└── validators.ts              # Zod схемы валидации
```

---

## Фазы разработки

### Фаза 1: Подключение PostgreSQL

**Приоритет**: 🔴 Критический  
**Срок**: 0.5 дня

| Задача                 | Описание                      |
| ---------------------- | ----------------------------- |
| Установка зависимостей | `pg`, `@types/pg` или Prisma  |
| Connection pool        | Настройка пула соединений     |
| Environment variables  | `DATABASE_URL` в `.env.local` |
| Health check           | Проверка соединения с БД      |

**Установка**:

```bash
npm install pg @types/pg
# или
npm install prisma @prisma/client
```

**lib/db/index.ts** (с pg):

```typescript
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function query<T>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export { pool };
```

**.env.local**:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/pms_db
```

---

### Фаза 2: Каталог товаров (PostgreSQL)

**Приоритет**: 🟠 Высокий  
**Срок**: 1 день

#### 2.1 Классы товаров

**lib/db/queries/classes.ts**:

```typescript
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
```

**app/api/classes/route.ts** (обновлённый):

```typescript
import { NextResponse } from "next/server";
import { getAllClasses, createClass } from "@/lib/db/queries/classes";

export async function GET() {
  try {
    const classes = await getAllClasses();
    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки классов" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.sh_name || !body.name) {
      return NextResponse.json(
        { error: "sh_name и name обязательны" },
        { status: 400 }
      );
    }

    const newClass = await createClass(body);
    return NextResponse.json(newClass, { status: 201 });
  } catch (error: any) {
    if (error.code === "23505") {
      // unique violation
      return NextResponse.json(
        { error: "Класс с таким sh_name уже существует" },
        { status: 409 }
      );
    }
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Ошибка создания класса" },
      { status: 500 }
    );
  }
}
```

#### 2.2 Параметры

**lib/db/queries/parameters.ts**:

```typescript
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
```

#### 2.3 Товары

**lib/db/queries/products.ts**:

```typescript
import { query, queryOne } from "../index";
import type { Prod, ParProd } from "@/lib/types";

export async function getAllProducts(classId?: number): Promise<Prod[]> {
  const baseQuery = `
    SELECT p.id_prod, p.name, p.id_class, c.name as class_name
    FROM prod p
    JOIN chem_class c ON c.id_class = p.id_class
  `;

  if (classId) {
    return query<Prod>(
      baseQuery + ` WHERE p.id_class = $1 ORDER BY p.id_prod`,
      [classId]
    );
  }
  return query<Prod>(baseQuery + ` ORDER BY p.id_prod`);
}

export async function getProductById(id: string): Promise<Prod | null> {
  return queryOne<Prod>(
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
}): Promise<Prod> {
  const rows = await query<Prod>(
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
): Promise<Prod | null> {
  const rows = await query<Prod>(
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
```

---

### Фаза 3: Справочники процессов

**Приоритет**: 🟠 Высокий  
**Срок**: 0.5 дня

#### 3.1 Типы состояний (с PostgreSQL функциями)

**lib/db/queries/states.ts**:

```typescript
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
    `
    SELECT * FROM ins_type_state($1, $2)
  `,
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
    `
    DELETE FROM type_state WHERE id_state = $1 RETURNING id_state
  `,
    [id]
  );
  return rows.length > 0;
}
```

#### 3.2 Типы решений

**lib/db/queries/decisions.ts**:

```typescript
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
    `
    SELECT * FROM ins_decision($1, $2)
  `,
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
    `
    DELETE FROM type_decision WHERE id_dec = $1 RETURNING id_dec
  `,
    [id]
  );
  return rows.length > 0;
}
```

---

### Фаза 4: Конструктор процессов (Шаблоны)

**Приоритет**: 🟡 Средний  
**Срок**: 1 день

**lib/db/queries/templates.ts**:

```typescript
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

export async function getTemplateById(id: number): Promise<TypeProcess | null> {
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
    `
    SELECT * FROM ins_type_process($1, $2, $3)
  `,
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
    `
    DELETE FROM type_process WHERE id_type_proc = $1 RETURNING id_type_proc
  `,
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
    `
    SELECT ins_state($1, $2, $3)
  `,
    [templateId, stateId, flagBeg]
  );
  return rows[0].ins_state;
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
    `
    SELECT ins_decision_map($1, $2, $3)
  `,
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
```

---

### Фаза 5: Исполнитель процессов ⭐

**Приоритет**: 🔴 Критический  
**Срок**: 1.5 дня

**lib/db/queries/processes.ts**:

```typescript
import { query, queryOne } from "../index";
import type { Process, TrajectoryStep } from "@/lib/types";

export async function getAllProcesses(filters?: {
  templateId?: number;
  productId?: string;
}): Promise<Process[]> {
  let sql = `
    SELECT p.id_process, p.name, p.sh_name, p.id_prod, p.type_pr,
           pr.name as product_name,
           tp.name as template_name
    FROM process p
    JOIN prod pr ON pr.id_prod = p.id_prod
    JOIN type_process tp ON tp.id_type_proc = p.type_pr
    WHERE 1=1
  `;
  const params: any[] = [];

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

// Использование PostgreSQL функции read_trajectory
export async function getTrajectory(
  processId: number
): Promise<TrajectoryStep[]> {
  return query<TrajectoryStep>(
    `
    SELECT * FROM read_trajectory($1)
    ORDER BY num_pos
  `,
    [processId]
  );
}

export async function getCurrentState(
  processId: number
): Promise<TrajectoryStep | null> {
  return queryOne<TrajectoryStep>(
    `
    SELECT * FROM read_trajectory($1)
    ORDER BY num_pos DESC
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
    `
    SELECT * FROM ins_process($1, $2, $3)
  `,
    [data.type_pr, data.id_prod, data.id_per]
  );
  return rows[0];
}

export async function deleteProcess(id: number): Promise<boolean> {
  const rows = await query(
    `
    DELETE FROM process WHERE id_process = $1 RETURNING id_process
  `,
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

// Принять решение (добавить шаг в траекторию)
export async function makeDecision(
  processId: number,
  decisionId: number,
  personId: number,
  nextStateId: number
): Promise<TrajectoryStep> {
  // Получаем следующий num_pos
  const maxPos = await queryOne<{ max_pos: number }>(
    `
    SELECT COALESCE(MAX(num_pos), 0) as max_pos 
    FROM trajctory 
    WHERE id_process = $1
  `,
    [processId]
  );

  const nextPos = (maxPos?.max_pos || 0) + 1;

  // Обновляем предыдущий шаг (добавляем решение)
  await query(
    `
    UPDATE trajctory 
    SET id_dec = $2 
    WHERE id_process = $1 AND num_pos = $3
  `,
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
```

**lib/db/transitions.ts** — Логика переходов:

```typescript
// Маппинг переходов (можно вынести в БД в будущем)
interface TransitionKey {
  fromState: number;
  decision: number;
}

const transitionMap: Map<string, number> = new Map([
  // Process 1: Включение товара в каталог
  ["1_1", 2], // draft + submit → moderation
  ["1_9", 7], // draft + cancel → cancelled
  ["2_2", 3], // moderation + approve → published
  ["2_3", 5], // moderation + reject → rejected
  ["2_4", 4], // moderation + request_changes → corrections
  ["4_5", 1], // corrections + apply_changes → draft
  ["4_9", 7], // corrections + cancel → cancelled
  ["3_6", 6], // published + pause → paused
  ["3_8", 8], // published + archive → archived
  ["6_7", 3], // paused + resume → published
  ["6_8", 8], // paused + archive → archived
]);

export function getNextState(
  currentStateId: number,
  decisionId: number
): number | null {
  const key = `${currentStateId}_${decisionId}`;
  return transitionMap.get(key) || null;
}
```

**app/api/processes/[id]/decide/route.ts** (обновлённый):

```typescript
import { NextResponse } from "next/server";
import {
  getProcessById,
  getCurrentState,
  getAvailableDecisions,
  makeDecision,
} from "@/lib/db/queries/processes";
import { getNextState } from "@/lib/db/transitions";
import { getStateById } from "@/lib/db/queries/states";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const processId = parseInt(id);
    const body = await request.json();

    if (!body.id_dec) {
      return NextResponse.json({ error: "id_dec обязателен" }, { status: 400 });
    }

    // Проверяем процесс
    const process = await getProcessById(processId);
    if (!process) {
      return NextResponse.json({ error: "Процесс не найден" }, { status: 404 });
    }

    // Получаем текущее состояние
    const currentStep = await getCurrentState(processId);
    if (!currentStep) {
      return NextResponse.json({ error: "Траектория пуста" }, { status: 400 });
    }

    // Проверяем, что решение допустимо
    const availableDecisions = await getAvailableDecisions(processId);
    const isAllowed = availableDecisions.some((d) => d.id_dec === body.id_dec);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Это решение недопустимо в текущем состоянии" },
        { status: 422 }
      );
    }

    // Определяем следующее состояние
    const nextStateId = getNextState(currentStep.id_state, body.id_dec);
    if (!nextStateId) {
      return NextResponse.json(
        { error: "Переход для данного решения не определён" },
        { status: 422 }
      );
    }

    // Применяем решение
    const personId = body.id_per || 1; // Default user
    await makeDecision(processId, body.id_dec, personId, nextStateId);

    // Получаем информацию о новом состоянии
    const newState = await getStateById(nextStateId);

    return NextResponse.json({
      success: true,
      new_state: {
        id_state: nextStateId,
        state_name: newState?.name || "—",
      },
    });
  } catch (error) {
    console.error("Error making decision:", error);
    return NextResponse.json(
      { error: "Ошибка обработки решения" },
      { status: 500 }
    );
  }
}
```

---

## Валидация (Zod)

**lib/validators.ts**:

```typescript
import { z } from "zod";

export const createClassSchema = z.object({
  sh_name: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  main_class: z.number().int().positive().nullable().optional(),
});

export const createProductSchema = z.object({
  id_prod: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  id_class: z.number().int().positive(),
});

export const createProcessSchema = z.object({
  type_pr: z.number().int().positive(),
  id_prod: z.string().min(1),
  id_per: z.number().int().positive().optional(),
});

export const makeDecisionSchema = z.object({
  id_dec: z.number().int().positive(),
  id_per: z.number().int().positive().optional(),
  comment: z.string().max(500).optional(),
});
```

---

## Docker Compose (разработка)

**docker-compose.yaml**:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: pms
      POSTGRES_PASSWORD: pms_secret
      POSTGRES_DB: pms_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./ai_docs/migration.sql:/docker-entrypoint-initdb.d/01-schema.sql

volumes:
  postgres_data:
```

**Запуск**:

```bash
docker-compose up -d
```

---

## Миграция с mock на PostgreSQL

### Шаги миграции

1. **Установка зависимостей**:

   ```bash
   npm install pg @types/pg zod
   ```

2. **Создать `lib/db/index.ts`** — connection pool

3. **Создать `lib/db/queries/*.ts`** — SQL запросы для каждой сущности

4. **Обновить API Routes** — заменить импорты mock-data на queries

5. **Добавить `.env.local`**:

   ```env
   DATABASE_URL=postgresql://pms:pms_secret@localhost:5432/pms_db
   ```

6. **Запустить PostgreSQL**:

   ```bash
   docker-compose up -d
   ```

7. **Протестировать каждый endpoint**

---

## Критерии приёмки (MVP)

### Must Have ✅

- [x] PostgreSQL connection pool
- [x] CRUD для классов, параметров, товаров
- [x] CRUD для типов состояний и решений
- [x] CRUD для шаблонов процессов
- [x] Создание процессов (вызов `ins_process`)
- [x] Получение траектории (`read_trajectory`)
- [x] Получение доступных решений
- [x] Принятие решения с переходом
- [x] Error handling с правильными HTTP кодами

### Should Have 🟡

- [x] Zod валидация на всех endpoints
- [ ] Транзакции для сложных операций
- [x] Логирование ошибок

### Nice to Have 🔵

- [ ] Connection retry logic
- [ ] Query caching
- [ ] Rate limiting

---

## Файлы для создания/обновления

| Файл                           | Действие                            | Статус |
| ------------------------------ | ----------------------------------- | ------ |
| `lib/db/index.ts`              | Создать                             | ✅     |
| `lib/db/queries/classes.ts`    | Создать                             | ✅     |
| `lib/db/queries/parameters.ts` | Создать                             | ✅     |
| `lib/db/queries/products.ts`   | Создать                             | ✅     |
| `lib/db/queries/states.ts`     | Создать                             | ✅     |
| `lib/db/queries/decisions.ts`  | Создать                             | ✅     |
| `lib/db/queries/templates.ts`  | Создать                             | ✅     |
| `lib/db/queries/processes.ts`  | Создать                             | ✅     |
| `lib/db/transitions.ts`        | Создать                             | ✅     |
| `lib/validators.ts`            | Создать                             | ✅     |
| `app/api/*/route.ts`           | Обновить (заменить mock на queries) | ✅     |
| `.env.local`                   | Создать                             | ✅     |
| `docker-compose.yaml`          | Создать                             | ✅     |
| `app/api/health/route.ts`      | Создать (health check)              | ✅     |

---

_Документ обновлён: 15.12.2024_  
_Реализация завершена: 15.12.2024_ ✅
