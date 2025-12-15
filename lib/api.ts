import type { ApiResponse } from "./types";

const API_BASE = "/api";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null as T,
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { data, success: true };
  } catch (error) {
    return {
      data: null as T,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | undefined>) =>
    request<T>(endpoint, { method: "GET", params }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
};

// ====== Специфичные API функции ======

// Каталог
export const catalogApi = {
  // Классы
  getClasses: () => api.get<import("./types").ProductClass[]>("/classes"),
  getClass: (id: number) => api.get<import("./types").ProductClass>(`/classes/${id}`),
  createClass: (data: Omit<import("./types").ProductClass, "id_class">) =>
    api.post<import("./types").ProductClass>("/classes", data),
  updateClass: (id: number, data: Partial<import("./types").ProductClass>) =>
    api.put<import("./types").ProductClass>(`/classes/${id}`, data),
  deleteClass: (id: number) => api.delete(`/classes/${id}`),

  // Параметры
  getParameters: () => api.get<import("./types").Parameter[]>("/parameters"),
  createParameter: (data: Omit<import("./types").Parameter, "id_par">) =>
    api.post<import("./types").Parameter>("/parameters", data),
  updateParameter: (id: number, data: Partial<import("./types").Parameter>) =>
    api.put<import("./types").Parameter>(`/parameters/${id}`, data),
  deleteParameter: (id: number) => api.delete(`/parameters/${id}`),

  // Товары
  getProducts: (classId?: number) =>
    api.get<import("./types").Product[]>("/products", { class_id: classId }),
  getProduct: (id: string) => api.get<import("./types").Product>(`/products/${id}`),
  createProduct: (data: Omit<import("./types").Product, "class_name" | "parameters">) =>
    api.post<import("./types").Product>("/products", data),
  updateProduct: (id: string, data: Partial<import("./types").Product>) =>
    api.put<import("./types").Product>(`/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
  updateProductParameters: (id: string, params: import("./types").ParameterValue[]) =>
    api.put(`/products/${id}/parameters`, { parameters: params }),
};

// Справочники процессов
export const dictionaryApi = {
  // Типы состояний
  getStateTypes: () => api.get<import("./types").StateType[]>("/states"),
  createStateType: (data: Omit<import("./types").StateType, "id_state">) =>
    api.post<{ id_state: number; o_res: number }>("/states", data),
  updateStateType: (id: number, data: Partial<import("./types").StateType>) =>
    api.put<import("./types").StateType>(`/states/${id}`, data),
  deleteStateType: (id: number) => api.delete(`/states/${id}`),

  // Типы решений
  getDecisionTypes: () => api.get<import("./types").DecisionType[]>("/decisions"),
  createDecisionType: (data: Omit<import("./types").DecisionType, "id_dec">) =>
    api.post<{ id_dec: number; o_res: number }>("/decisions", data),
  updateDecisionType: (id: number, data: Partial<import("./types").DecisionType>) =>
    api.put<import("./types").DecisionType>(`/decisions/${id}`, data),
  deleteDecisionType: (id: number) => api.delete(`/decisions/${id}`),
};

// Шаблоны процессов
export const templateApi = {
  getTemplates: () => api.get<import("./types").ProcessTemplate[]>("/templates"),
  getTemplate: (id: number) => api.get<import("./types").ProcessTemplate>(`/templates/${id}`),
  createTemplate: (data: Pick<import("./types").ProcessTemplate, "name" | "sh_name" | "id_class">) =>
    api.post<{ id_type_proc: number; o_res: number }>("/templates", data),
  updateTemplate: (id: number, data: Partial<import("./types").ProcessTemplate>) =>
    api.put<import("./types").ProcessTemplate>(`/templates/${id}`, data),
  deleteTemplate: (id: number) => api.delete(`/templates/${id}`),

  // Состояния в шаблоне
  addState: (templateId: number, data: { id_state: number; flag_beg?: number }) =>
    api.post(`/templates/${templateId}/states`, data),
  removeState: (templateId: number, stateId: number) =>
    api.delete(`/templates/${templateId}/states/${stateId}`),

  // Маппинг решений
  addDecision: (templateId: number, stateId: number, decisionId: number) =>
    api.post(`/templates/${templateId}/states/${stateId}/decisions`, { id_dec: decisionId }),
  removeDecision: (templateId: number, stateId: number, decisionId: number) =>
    api.delete(`/templates/${templateId}/states/${stateId}/decisions/${decisionId}`),
};

// Исполнение процессов
export const processApi = {
  getProcesses: (filters?: { template_id?: number; product_id?: string }) =>
    api.get<import("./types").Process[]>("/processes", filters),
  getProcess: (id: number) => api.get<import("./types").Process>(`/processes/${id}`),
  createProcess: (data: { type_pr: number; id_prod: string; id_per?: number }) =>
    api.post<{ id_process: number; o_res: number }>("/processes", data),
  
  // Траектория
  getTrajectory: (id: number) =>
    api.get<import("./types").TrajectoryStep[]>(`/processes/${id}/trajectory`),
  
  // Доступные решения
  getAvailableDecisions: (id: number) =>
    api.get<import("./types").DecisionType[]>(`/processes/${id}/decisions`),
  
  // Принять решение
  makeDecision: (id: number, data: { id_dec: number; id_per?: number }) =>
    api.post(`/processes/${id}/decide`, data),
};

// Пользователи
export const userApi = {
  getUsers: () => api.get<import("./types").Person[]>("/users"),
  getGroups: () => api.get<import("./types").UserGroup[]>("/groups"),
};

