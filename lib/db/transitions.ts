// Маппинг переходов между состояниями
// Формат: "fromStateId_decisionId" -> nextStateId
// В будущем можно вынести в БД (таблицы funct, predicat, formula)

const transitionMap: Map<string, number> = new Map([
  // ====== Process 1: Включение товара в каталог ======
  // Из состояния "Черновик" (1)
  ["1_1", 2], // draft + submit → moderation
  ["1_9", 7], // draft + cancel → cancelled

  // Из состояния "На модерации" (2)
  ["2_2", 3], // moderation + approve → published
  ["2_3", 5], // moderation + reject → rejected
  ["2_4", 4], // moderation + request_changes → corrections

  // Из состояния "Запрошены правки" (4)
  ["4_5", 1], // corrections + apply_changes → draft
  ["4_9", 7], // corrections + cancel → cancelled

  // Из состояния "Опубликован" (3)
  ["3_6", 6], // published + pause → paused
  ["3_8", 8], // published + archive → archived

  // Из состояния "Приостановлен" (6)
  ["6_7", 3], // paused + resume → published
  ["6_8", 8], // paused + archive → archived

  // ====== Process 2: Управление изменениями карточки товара ======
  // Из состояния "Выбор товара" (9)
  ["9_10", 10], // select_product + create_copy → create_copy

  // Из состояния "Создание копии" (10)
  ["10_11", 11], // create_copy + start_edit → edit_params

  // Из состояния "Редактирование параметров" (11)
  ["11_12", 12], // edit_params + to_moderation → mod_approval

  // Из состояния "Согласование модератором" (12)
  ["12_14", 13], // mod_approval + mod_approved → mgr_approval
  ["12_13", 11], // mod_approval + revision → edit_params

  // Из состояния "Согласование руководителем" (13)
  ["13_15", 14], // mgr_approval + mgr_approved → change_permission
  ["13_13", 11], // mgr_approval + revision → edit_params

  // Из состояния "Разрешение на ввод изменений" (14)
  ["14_16", 15], // change_permission + allow → apply_changes
  ["14_17", 16], // change_permission + postpone → postponed

  // Из состояния "Ввод изменений в действие" (15)
  ["15_19", 17], // apply_changes + done → completed

  // Из состояния "Изменение отложено" (16)
  ["16_18", 14], // postponed + retry → change_permission
]);

export function getNextState(
  currentStateId: number,
  decisionId: number
): number | null {
  const key = `${currentStateId}_${decisionId}`;
  return transitionMap.get(key) || null;
}

// Получить все возможные переходы из состояния
export function getTransitionsFromState(
  stateId: number
): { decisionId: number; nextStateId: number }[] {
  const transitions: { decisionId: number; nextStateId: number }[] = [];

  for (const [key, nextState] of transitionMap) {
    const [fromState, decision] = key.split("_").map(Number);
    if (fromState === stateId) {
      transitions.push({ decisionId: decision, nextStateId: nextState });
    }
  }

  return transitions;
}

