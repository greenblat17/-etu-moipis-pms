import type {
  ProductClass,
  Product,
  Parameter,
  ParameterValue,
  StateType,
  DecisionType,
  ProcessTemplate,
  TemplateState,
  Process,
  TrajectoryStep,
  Person,
} from "./types";

// ====== Классы товаров ======
export const mockClasses: ProductClass[] = [
  { id_class: 1, short_name: "electronics", name: "Электроника", main_class: null },
  { id_class: 2, short_name: "phones", name: "Смартфоны", main_class: 1 },
  { id_class: 3, short_name: "laptops", name: "Ноутбуки", main_class: 1 },
  { id_class: 4, short_name: "clothing", name: "Одежда", main_class: null },
  { id_class: 5, short_name: "shoes", name: "Обувь", main_class: 4 },
];

// ====== Параметры ======
export const mockParameters: Parameter[] = [
  { id_par: 1, short_name: "color", name: "Цвет", type_par: "string" },
  { id_par: 2, short_name: "size", name: "Размер", type_par: "string" },
  { id_par: 3, short_name: "weight", name: "Вес (г)", type_par: "number" },
  { id_par: 4, short_name: "brand", name: "Бренд", type_par: "string" },
  { id_par: 5, short_name: "memory", name: "Память (ГБ)", type_par: "number" },
  { id_par: 6, short_name: "screen", name: "Диагональ экрана", type_par: "number" },
];

// ====== Товары ======
export const mockProducts: Product[] = [
  { id_prod: "PROD-001", name: "iPhone 15 Pro", id_class: 2, class_name: "Смартфоны" },
  { id_prod: "PROD-002", name: "Samsung Galaxy S24", id_class: 2, class_name: "Смартфоны" },
  { id_prod: "PROD-003", name: "MacBook Pro 14", id_class: 3, class_name: "Ноутбуки" },
  { id_prod: "PROD-004", name: "Кроссовки Nike Air Max", id_class: 5, class_name: "Обувь" },
];

// ====== Значения параметров ======
export const mockParameterValues: ParameterValue[] = [
  { id_prod: "PROD-001", id_par: 1, val: "Титановый серый", note: null },
  { id_prod: "PROD-001", id_par: 3, val: "187", note: null },
  { id_prod: "PROD-001", id_par: 4, val: "Apple", note: null },
  { id_prod: "PROD-001", id_par: 5, val: "256", note: null },
  { id_prod: "PROD-001", id_par: 6, val: "6.1", note: null },
  { id_prod: "PROD-002", id_par: 1, val: "Фиолетовый", note: null },
  { id_prod: "PROD-002", id_par: 4, val: "Samsung", note: null },
  { id_prod: "PROD-002", id_par: 5, val: "128", note: null },
];

// ====== Типы состояний ======
export const mockStateTypes: StateType[] = [
  { id_state: 1, sh_name: "draft", name: "Черновик карточки" },
  { id_state: 2, sh_name: "moderation", name: "На модерации" },
  { id_state: 3, sh_name: "published", name: "Опубликован" },
  { id_state: 4, sh_name: "corrections", name: "Запрошены правки" },
  { id_state: 5, sh_name: "rejected", name: "Отклонён" },
  { id_state: 6, sh_name: "paused", name: "Приостановлен" },
  { id_state: 7, sh_name: "cancelled", name: "Отменён" },
  { id_state: 8, sh_name: "archived", name: "Архив" },
];

// ====== Типы решений ======
export const mockDecisionTypes: DecisionType[] = [
  { id_dec: 1, sh_name: "submit", name: "Отправить на модерацию" },
  { id_dec: 2, sh_name: "approve", name: "Одобрить" },
  { id_dec: 3, sh_name: "reject", name: "Отклонить" },
  { id_dec: 4, sh_name: "request_changes", name: "Запросить правки" },
  { id_dec: 5, sh_name: "apply_changes", name: "Внести правки" },
  { id_dec: 6, sh_name: "pause", name: "Приостановить" },
  { id_dec: 7, sh_name: "resume", name: "Возобновить" },
  { id_dec: 8, sh_name: "archive", name: "Архивировать" },
  { id_dec: 9, sh_name: "cancel", name: "Отменить" },
];

// ====== Шаблоны процессов ======
export const mockTemplates: ProcessTemplate[] = [
  {
    id_type_proc: 1,
    name: "Включение нового товара в каталог",
    sh_name: "new_product",
    id_class: 1,
    base_process: null,
    n: null,
    class_name: "Электроника",
  },
  {
    id_type_proc: 2,
    name: "Управление изменениями карточки товара",
    sh_name: "product_changes",
    id_class: null,
    base_process: null,
    n: null,
  },
];

// ====== Состояния в шаблонах ======
export const mockTemplateStates: TemplateState[] = [
  { id_type_pr: 1, id_state: 1, flag_beg: 1, id_f: null, state_name: "Черновик карточки", state_sh_name: "draft" },
  { id_type_pr: 1, id_state: 2, flag_beg: 0, id_f: null, state_name: "На модерации", state_sh_name: "moderation" },
  { id_type_pr: 1, id_state: 3, flag_beg: 0, id_f: null, state_name: "Опубликован", state_sh_name: "published" },
  { id_type_pr: 1, id_state: 4, flag_beg: 0, id_f: null, state_name: "Запрошены правки", state_sh_name: "corrections" },
  { id_type_pr: 1, id_state: 5, flag_beg: 0, id_f: null, state_name: "Отклонён", state_sh_name: "rejected" },
];

// ====== Пользователи ======
export const mockPersons: Person[] = [
  { id_per: 1, fio: "Иванов Иван Иванович" },
  { id_per: 2, fio: "Петров Пётр Петрович" },
  { id_per: 3, fio: "Сидорова Анна Сергеевна" },
];

// ====== Процессы (экземпляры) ======
export const mockProcesses: Process[] = [
  {
    id_process: 1,
    name: "Процесс #1 для PROD-001",
    sh_name: "1",
    id_prod: "PROD-001",
    type_pr: 1,
  },
  {
    id_process: 2,
    name: "Процесс #1 для PROD-002",
    sh_name: "1",
    id_prod: "PROD-002",
    type_pr: 1,
  },
];

// ====== Траектории ======
export const mockTrajectories: Record<number, TrajectoryStep[]> = {
  1: [
    { num_pos: 1, id_state: 1, state_name: "Черновик карточки", id_dec: null, dec_name: null, id_per: 1, fio: "Иванов Иван Иванович", d_time: "2024-12-15T10:30:00Z" },
    { num_pos: 2, id_state: 2, state_name: "На модерации", id_dec: 1, dec_name: "Отправить на модерацию", id_per: 1, fio: "Иванов Иван Иванович", d_time: "2024-12-15T11:45:00Z" },
    { num_pos: 3, id_state: 3, state_name: "Опубликован", id_dec: 2, dec_name: "Одобрить", id_per: 2, fio: "Петров Пётр Петрович", d_time: "2024-12-15T14:20:00Z" },
  ],
  2: [
    { num_pos: 1, id_state: 1, state_name: "Черновик карточки", id_dec: null, dec_name: null, id_per: 1, fio: "Иванов Иван Иванович", d_time: "2024-12-15T09:00:00Z" },
    { num_pos: 2, id_state: 2, state_name: "На модерации", id_dec: 1, dec_name: "Отправить на модерацию", id_per: 1, fio: "Иванов Иван Иванович", d_time: "2024-12-15T09:30:00Z" },
  ],
};

// ====== Helpers ======
let classIdCounter = mockClasses.length + 1;
let paramIdCounter = mockParameters.length + 1;
let stateIdCounter = mockStateTypes.length + 1;
let decisionIdCounter = mockDecisionTypes.length + 1;
let templateIdCounter = mockTemplates.length + 1;
let processIdCounter = mockProcesses.length + 1;

export function getNextClassId() { return classIdCounter++; }
export function getNextParamId() { return paramIdCounter++; }
export function getNextStateId() { return stateIdCounter++; }
export function getNextDecisionId() { return decisionIdCounter++; }
export function getNextTemplateId() { return templateIdCounter++; }
export function getNextProcessId() { return processIdCounter++; }

