import { z } from "zod";

// Classes
export const createClassSchema = z.object({
  sh_name: z.string().min(1, "Краткое имя обязательно").max(50),
  name: z.string().min(1, "Название обязательно").max(200),
  main_class: z.number().int().positive().nullable().optional(),
});

export const updateClassSchema = createClassSchema.partial();

// Parameters
export const createParameterSchema = z.object({
  sh_name: z.string().min(1, "Краткое имя обязательно").max(50),
  name: z.string().min(1, "Название обязательно").max(200),
  type_par: z.enum(["text", "number", "bool", "date"]),
});

export const updateParameterSchema = createParameterSchema.partial();

// Products
export const createProductSchema = z.object({
  id_prod: z.string().min(1, "ID товара обязателен").max(50),
  name: z.string().min(1, "Название обязательно").max(200),
  id_class: z.number().int().positive("Класс обязателен"),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  id_class: z.number().int().positive().optional(),
});

// Product Parameters
export const updateProductParametersSchema = z.object({
  parameters: z.array(
    z.object({
      id_par: z.number().int().positive(),
      val: z.string().nullable(),
      note: z.string().nullable().optional(),
    })
  ),
});

// States
export const createStateSchema = z.object({
  sh_name: z.string().min(1, "Краткое имя обязательно").max(50),
  name: z.string().min(1, "Название обязательно").max(200),
});

export const updateStateSchema = createStateSchema.partial();

// Decisions
export const createDecisionSchema = z.object({
  sh_name: z.string().min(1, "Краткое имя обязательно").max(50),
  name: z.string().min(1, "Название обязательно").max(200),
});

export const updateDecisionSchema = createDecisionSchema.partial();

// Templates
export const createTemplateSchema = z.object({
  sh_name: z.string().min(1, "Краткое имя обязательно").max(50),
  name: z.string().min(1, "Название обязательно").max(200),
  id_class: z.number().int().positive().nullable().optional(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

// Template States
export const addStateToTemplateSchema = z.object({
  id_state: z.number().int().positive("ID состояния обязателен"),
  flag_beg: z.number().int().min(0).max(1).default(0),
});

export const updateTemplateStateSchema = z.object({
  flag_beg: z.number().int().min(0).max(1),
});

// Template State Decisions
export const addDecisionToStateSchema = z.object({
  id_dec: z.number().int().positive("ID решения обязателен"),
});

// Processes
export const createProcessSchema = z.object({
  type_pr: z.number().int().positive("Шаблон процесса обязателен"),
  id_prod: z.string().min(1, "Товар обязателен"),
  id_per: z.number().int().positive().optional().default(1),
});

// Make Decision
export const makeDecisionSchema = z.object({
  id_dec: z.number().int().positive("ID решения обязателен"),
  id_per: z.number().int().positive().optional().default(1),
  comment: z.string().max(500).optional(),
});

// Helper to validate and return errors
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });

  return { success: false, errors };
}
