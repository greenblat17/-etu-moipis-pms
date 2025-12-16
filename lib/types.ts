// ====== Каталог товаров ======

export interface ProductClass {
  id_class: number;
  short_name: string;
  name: string;
  main_class: number | null;
  parent_name?: string | null;
}

// Alias for database queries (uses sh_name instead of short_name)
export interface ChemClass {
  id_class: number;
  sh_name: string;
  name: string;
  main_class: number | null;
}

export interface Product {
  id_prod: string;
  name: string;
  id_class: number;
  class_name?: string;
  parameters?: ParameterValue[];
}

export interface Parameter {
  id_par: number;
  short_name: string;
  name: string;
  type_par: string;
}

// Alias for database queries
export interface Parametr {
  id_par: number;
  sh_name: string;
  name: string;
  type_par: string;
}

export interface ParameterConstraint {
  id_par: number;
  id_class: number;
  min_val: string | null;
  max_val: string | null;
}

export interface ParameterValue {
  id_prod: string;
  id_par: number;
  val: string | null;
  note: string | null;
  parameter?: Parameter;
}

// Alias for database queries
export interface ParProd {
  id_prod: string;
  id_par: number;
  val: string | null;
  note: string | null;
  par_sh_name?: string;
  par_name?: string;
  type_par?: string;
}

// ====== Справочники процессов ======

export interface StateType {
  id_state: number;
  name: string;
  sh_name: string;
}

// Alias for database
export type TypeState = StateType;

export interface DecisionType {
  id_dec: number;
  name: string;
  sh_name: string;
}

// Alias for database
export type TypeDecision = DecisionType;

// ====== Шаблоны процессов ======

export interface ProcessTemplate {
  id_type_proc: number;
  name: string;
  sh_name: string;
  id_class: number | null;
  base_process: number | null;
  n: number | null;
  class_name?: string;
  states?: TemplateState[];
}

// Alias for database
export type TypeProcess = ProcessTemplate;

export interface TemplateState {
  id_type_pr: number;
  id_state: number;
  flag_beg: number;
  id_f: number | null;
  state_name?: string;
  state_sh_name?: string;
  decisions?: DecisionType[];
}

// Alias for database
export type State = TemplateState;

export interface DecisionMap {
  id_type_proc: number;
  id_state: number;
  id_dec: number;
}

// ====== Пользователи и доступ ======

export interface Person {
  id_per: number;
  fio: string;
}

export interface UserGroup {
  id_gr: number;
  name: string;
}

export interface GroupMembership {
  id_gr: number;
  id_per: number;
}

export interface StateAccess {
  id_gr: number;
  id_state: number;
  id_type_pr: number;
}

// ====== Исполнение процессов ======

export interface Process {
  id_process: number;
  name: string;
  sh_name: string;
  id_prod: string;
  type_pr: number;
  product?: Product;
  template?: ProcessTemplate;
  current_state?: TrajectoryStep;
}

export interface TrajectoryStep {
  num_pos: number;
  id_state: number;
  state_name: string;
  id_dec: number | null;
  dec_name: string | null;
  id_per: number | null;
  fio: string | null;
  d_time: string;
}

// ====== Логика переходов (ДНФ) ======

export interface TransitionFunction {
  id_f: number;
  name: string;
}

export interface Predicate {
  id_pred: number;
  id_state: number | null;
  id_dec: number | null;
  yes_par: number | null;
}

export interface Formula {
  id_f: number;
  num_dis: number;
  num_con: number;
  id_pred: number;
}

// ====== API Response types ======

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

