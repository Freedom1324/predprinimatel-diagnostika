/**
 * SCORING CONFIG — матрица баллов.
 *
 * Источник: Excel "Модель_скоринга_диагностика_предпринимателя_КАЛЬКУЛЯТОР.xlsx",
 * лист 02_Баллы (сверено с _Справочники — расхождений не найдено).
 *
 * Это ЕДИНСТВЕННОЕ место, где хранятся веса баллов.
 * UI и любые другие модули не должны хранить копии этих чисел.
 *
 * Правки этой матрицы — только по отдельному согласованию с заказчиком
 * (см. инструкцию в ТЗ, раздел 0). При изменении весов — поднять SCORING_VERSION
 * в rules.js и не пересчитывать задним числом уже сохранённые результаты (ТЗ п.14).
 */

import { CAPS } from './rules.js';

export const PROFILE_CODES = ["OPS", "AI", "CRM", "OWNER", "GROWTH"];

/**
 * Одиночный выбор и мультивыбор (Q9, Q17): SCORING_MATRIX[questionId] = массив { option, scores }.
 * Значение ответа пользователя ищется по точному совпадению текста варианта.
 * Q9/Q17 — мультивыбор, вклад суммируется по всем выбранным вариантам, затем капается (CAPS.Q9 / CAPS.Q17).
 */
export const SCORING_MATRIX = {
  Q3: [
    { option: "Мало клиентов, главная цель — привлечение", scores: { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 1 } },
    { option: "Клиенты есть, но внутри хаос", scores: { OPS: 2, AI: 1, CRM: 1, OWNER: 1, GROWTH: 0 } },
    { option: "Стабильно, но сильно зависит от меня", scores: { OPS: 2, AI: 0, CRM: 0, OWNER: 3, GROWTH: 2 } },
    { option: "Растём, старые процессы уже не справляются", scores: { OPS: 2, AI: 1, CRM: 1, OWNER: 2, GROWTH: 3 } },
    { option: "Хочу систематизировать", scores: { OPS: 2, AI: 1, CRM: 1, OWNER: 1, GROWTH: 3 } },
  ],
  Q4: [
    { option: "<1 часа", scores: { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 } },
    { option: "1–2 часа", scores: { OPS: 1, AI: 1, CRM: 0, OWNER: 1, GROWTH: 0 } },
    { option: "2–4 часа", scores: { OPS: 2, AI: 2, CRM: 0, OWNER: 1, GROWTH: 1 } },
    { option: ">4 часов", scores: { OPS: 3, AI: 3, CRM: 0, OWNER: 2, GROWTH: 1 } },
    { option: "Не могу оценить", scores: { OPS: 1, AI: 1, CRM: 0, OWNER: 1, GROWTH: 0 } },
  ],
  Q5: [
    { option: "Почти никогда", scores: { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 } },
    { option: "Иногда", scores: { OPS: 1, AI: 0, CRM: 0, OWNER: 1, GROWTH: 0 } },
    { option: "Регулярно", scores: { OPS: 2, AI: 0, CRM: 0, OWNER: 2, GROWTH: 1 } },
    { option: "Практически постоянно", scores: { OPS: 3, AI: 1, CRM: 0, OWNER: 3, GROWTH: 1 } },
    { option: "Нет сотрудников", scores: { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 } },
  ],
  Q6: [
    { option: "Практически ничего", scores: { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 } },
    { option: "Возникают отдельные вопросы", scores: { OPS: 1, AI: 0, CRM: 0, OWNER: 1, GROWTH: 0 } },
    { option: "Возникают задержки", scores: { OPS: 2, AI: 1, CRM: 0, OWNER: 2, GROWTH: 1 } },
    { option: "Большинство решений ждёт меня", scores: { OPS: 3, AI: 1, CRM: 0, OWNER: 3, GROWTH: 2 } },
    { option: "Работа почти останавливается", scores: { OPS: 3, AI: 1, CRM: 0, OWNER: 3, GROWTH: 2 } },
  ],
  Q7: [
    { option: "Всё полностью понятно", scores: { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 } },
    { option: "В основном понятно", scores: { OPS: 1, AI: 0, CRM: 0, OWNER: 1, GROWTH: 0 } },
    { option: "Есть пересечения", scores: { OPS: 2, AI: 0, CRM: 0, OWNER: 1, GROWTH: 1 } },
    { option: "Часто приходится объяснять заново", scores: { OPS: 3, AI: 1, CRM: 0, OWNER: 2, GROWTH: 1 } },
    { option: "Всё держится на устных договорённостях", scores: { OPS: 3, AI: 1, CRM: 0, OWNER: 3, GROWTH: 1 } },
  ],
  Q8: [
    { option: "Почти ничего", scores: { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 } },
    { option: "Несколько", scores: { OPS: 1, AI: 1, CRM: 0, OWNER: 1, GROWTH: 0 } },
    { option: "Довольно много", scores: { OPS: 2, AI: 2, CRM: 0, OWNER: 2, GROWTH: 1 } },
    { option: "Большинство", scores: { OPS: 3, AI: 2, CRM: 0, OWNER: 3, GROWTH: 1 } },
    { option: "Практически всё", scores: { OPS: 3, AI: 3, CRM: 0, OWNER: 3, GROWTH: 2 } },
  ],
  Q10: [
    { option: "Почти никогда", scores: { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 } },
    { option: "1–2 раза", scores: { OPS: 0, AI: 1, CRM: 0, OWNER: 0, GROWTH: 0 } },
    { option: "3–5 раз", scores: { OPS: 1, AI: 2, CRM: 0, OWNER: 1, GROWTH: 0 } },
    { option: "6–10 раз", scores: { OPS: 1, AI: 3, CRM: 1, OWNER: 1, GROWTH: 1 } },
    { option: ">10 раз", scores: { OPS: 2, AI: 3, CRM: 1, OWNER: 1, GROWTH: 1 } },
  ],
  Q13: [
    { option: "Не знаю, что автоматизировать", scores: { OPS: 0, AI: 3, CRM: 0, OWNER: 0, GROWTH: 1 } },
    { option: "Не знаю, как", scores: { OPS: 0, AI: 3, CRM: 0, OWNER: 0, GROWTH: 1 } },
    { option: "Нет времени", scores: { OPS: 1, AI: 2, CRM: 0, OWNER: 1, GROWTH: 1 } },
    { option: "Боюсь сложности", scores: { OPS: 0, AI: 2, CRM: 0, OWNER: 0, GROWTH: 0 } },
    { option: "Пробовал(а), не получилось", scores: { OPS: 0, AI: 3, CRM: 0, OWNER: 0, GROWTH: 1 } },
    { option: "Не вижу необходимости", scores: { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 } },
  ],
  Q14: [
    { option: "CRM", scores: { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 1 } },
    { option: "Таблицы", scores: { OPS: 0, AI: 1, CRM: 2, OWNER: 0, GROWTH: 0 } },
    { option: "Мессенджеры", scores: { OPS: 0, AI: 1, CRM: 3, OWNER: 1, GROWTH: 0 } },
    { option: "В нескольких местах", scores: { OPS: 1, AI: 2, CRM: 3, OWNER: 1, GROWTH: 1 } },
    { option: "В памяти", scores: { OPS: 1, AI: 1, CRM: 3, OWNER: 2, GROWTH: 0 } },
    { option: "По-разному", scores: { OPS: 1, AI: 1, CRM: 2, OWNER: 1, GROWTH: 0 } },
  ],
  Q15: [
    { option: "Никогда", scores: { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 } },
    { option: "Редко", scores: { OPS: 0, AI: 0, CRM: 1, OWNER: 0, GROWTH: 0 } },
    { option: "Иногда", scores: { OPS: 1, AI: 1, CRM: 2, OWNER: 1, GROWTH: 0 } },
    { option: "Регулярно", scores: { OPS: 1, AI: 2, CRM: 3, OWNER: 1, GROWTH: 1 } },
    { option: "Не знаю", scores: { OPS: 1, AI: 1, CRM: 2, OWNER: 1, GROWTH: 0 } },
  ],
  Q16: [
    { option: "Всегда", scores: { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 1 } },
    { option: "В основном", scores: { OPS: 0, AI: 0, CRM: 1, OWNER: 0, GROWTH: 1 } },
    { option: "Только по некоторым", scores: { OPS: 1, AI: 1, CRM: 2, OWNER: 1, GROWTH: 0 } },
    { option: "Нужно проверять", scores: { OPS: 1, AI: 1, CRM: 3, OWNER: 1, GROWTH: 0 } },
    { option: "Нет", scores: { OPS: 1, AI: 2, CRM: 3, OWNER: 2, GROWTH: 0 } },
  ],
  Q18: [
    { option: "Справимся без изменений", scores: { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 } },
    { option: "Будет немного сложнее", scores: { OPS: 1, AI: 0, CRM: 1, OWNER: 1, GROWTH: 1 } },
    { option: "Потребуются изменения", scores: { OPS: 2, AI: 1, CRM: 1, OWNER: 2, GROWTH: 2 } },
    { option: "Скорее всего будет серьёзный хаос", scores: { OPS: 3, AI: 2, CRM: 2, OWNER: 3, GROWTH: 3 } },
    { option: "Уже сейчас не справляемся", scores: { OPS: 3, AI: 2, CRM: 2, OWNER: 3, GROWTH: 3 } },
  ],
  Q9: [
    { option: "Перенос данных между таблицами", scores: { OPS: 0, AI: 3, CRM: 1, OWNER: 0, GROWTH: 0 } },
    { option: "Обработка заявок/лидов", scores: { OPS: 1, AI: 2, CRM: 2, OWNER: 1, GROWTH: 0 } },
    { option: "Ответы клиентам", scores: { OPS: 1, AI: 2, CRM: 2, OWNER: 1, GROWTH: 0 } },
    { option: "Документы", scores: { OPS: 1, AI: 2, CRM: 0, OWNER: 1, GROWTH: 0 } },
    { option: "Отчёты", scores: { OPS: 1, AI: 2, CRM: 1, OWNER: 1, GROWTH: 1 } },
    { option: "Напоминания", scores: { OPS: 1, AI: 2, CRM: 1, OWNER: 1, GROWTH: 0 } },
    { option: "Клиентская база", scores: { OPS: 0, AI: 2, CRM: 3, OWNER: 1, GROWTH: 0 } },
    { option: "Распределение задач", scores: { OPS: 2, AI: 2, CRM: 0, OWNER: 2, GROWTH: 1 } },
    { option: "Обработка информации", scores: { OPS: 0, AI: 3, CRM: 0, OWNER: 1, GROWTH: 0 } },
    { option: "Ничего", scores: { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 } },
  ],
  Q17: [
    { option: "Административные задачи", scores: { OPS: 2, AI: 2, CRM: 0, OWNER: 2, GROWTH: 0 } },
    { option: "Общение с клиентами", scores: { OPS: 1, AI: 2, CRM: 2, OWNER: 1, GROWTH: 0 } },
    { option: "Контроль сотрудников", scores: { OPS: 3, AI: 1, CRM: 0, OWNER: 3, GROWTH: 1 } },
    { option: "Документы", scores: { OPS: 1, AI: 2, CRM: 0, OWNER: 1, GROWTH: 0 } },
    { option: "Таблицы/отчёты", scores: { OPS: 1, AI: 3, CRM: 1, OWNER: 1, GROWTH: 0 } },
    { option: "Маркетинг", scores: { OPS: 0, AI: 1, CRM: 0, OWNER: 0, GROWTH: 2 } },
    { option: "Продажи", scores: { OPS: 0, AI: 1, CRM: 2, OWNER: 0, GROWTH: 2 } },
    { option: "Организационные задачи", scores: { OPS: 3, AI: 2, CRM: 0, OWNER: 2, GROWTH: 1 } },
    { option: "Другое", scores: { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 } },
  ],
};

/**
 * Q12 — открытый ответ, качественное кодирование в категории (ТЗ п.5).
 * В самом Excel баллы для Q12 хранились текстом в комментарии (например "AI=3; CRM=1"),
 * а не в числовых колонках — здесь они разобраны в ту же числовую форму, что и остальные вопросы.
 * Вклад капается CAPS.Q12 на профиль (см. normalization.js).
 */
export const Q12_CATEGORY_SCORES = {
  "Таблицы / перенос данных": { OPS: 0, AI: 3, CRM: 1, OWNER: 0, GROWTH: 0 },
  "Повторяющиеся ответы клиентам": { OPS: 0, AI: 3, CRM: 2, OWNER: 0, GROWTH: 0 },
  "Лиды / заявки": { OPS: 0, AI: 2, CRM: 3, OWNER: 0, GROWTH: 0 },
  "Документы": { OPS: 1, AI: 2, CRM: 0, OWNER: 0, GROWTH: 0 },
  "Отчётность": { OPS: 1, AI: 3, CRM: 0, OWNER: 0, GROWTH: 0 },
  "Контроль задач": { OPS: 3, AI: 2, CRM: 0, OWNER: 2, GROWTH: 0 },
  "Напоминания": { OPS: 1, AI: 2, CRM: 1, OWNER: 1, GROWTH: 0 },
  "Другое / неясно": { OPS: 0, AI: 0, CRM: 0, OWNER: 0, GROWTH: 0 },
};

/**
 * Q19 — коммерческий сигнал. Каждый вариант даёт +1 профилю И одновременно
 * является значением PURCHASE_INTENT (хранится отдельно, ТЗ п.5).
 */
export const Q19_OPTIONS = [
  { option: "Организация", profile: "OPS" },
  { option: "AI/автоматизация", profile: "AI" },
  { option: "Система клиентов", profile: "CRM" },
  { option: "Делегирование", profile: "OWNER" },
  { option: "Рост", profile: "GROWTH" },
  { option: "Пока ни за что", profile: null },
];

/**
 * Q20 — формат помощи. Не влияет на профиль, используется только для выбора
 * коммерческого формата оффера (ТЗ п.5, Excel 02_Баллы комментарий FORMAT_SCORE).
 */
export const Q20_FORMAT_OPTIONS = [
  { option: "Разовый анализ + план", formatScore: 2 },
  { option: "Готовая система/шаблон", formatScore: 3 },
  { option: "Настройка под ключ", formatScore: 3 },
  { option: "Постоянная поддержка", formatScore: 3 },
  { option: "Только рекомендации", formatScore: 1 },
];

