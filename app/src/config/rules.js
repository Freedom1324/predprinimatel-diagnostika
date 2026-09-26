/**
 * RULES / THRESHOLDS — конфигурация правил определения результата.
 *
 * Источник: ТЗ, разделы 4, 5, 7, 14.
 * Ничего из этого файла не должно дублироваться в UI.
 */

export const SCORING_VERSION = '1.0';

/** Профиль считается основным (PRIMARY), если его индекс >= этого значения. */
export const PRIMARY_THRESHOLD = 40;

/**
 * Профиль может быть вторичным (SECONDARY), только если:
 *  - его индекс >= SECONDARY_MIN_INDEX
 *  - отставание от первого профиля (в процентных пунктах) <= SECONDARY_MAX_GAP_PP
 */
export const SECONDARY_MIN_INDEX = 45;
export const SECONDARY_MAX_GAP_PP = 15;

/**
 * Если разрыв между первым и вторым профилем (в процентных пунктах) <= этого значения,
 * результат считается "TWO_LEADING_ZONES" — жёсткое разделение на primary/secondary не делается.
 * Правило имеет приоритет над обычным определением secondary (см. ТЗ п.7, "CLOSE_TOP").
 */
export const CLOSE_TOP_MAX_GAP_PP = 5;

/**
 * Капы (максимальный вклад вопроса в один профиль).
 * Источник: ТЗ п.5, Excel лист 03_Формулы.
 */
export const CAPS = {
  Q9: 9,
  Q12: 3,
  Q17: 9,
};

/**
 * Вопросы, исключённые из основного скоринга.
 * Q1, Q2 — сегментация. Q11 — аналитический модификатор. Q20 — формат оффера.
 */
export const NON_SCORING_QUESTIONS = ['Q1', 'Q2', 'Q11', 'Q20'];

/** Сколько знаков после запятой показывать у PROFILE_INDEX в UI/результате. */
export const INDEX_DISPLAY_PRECISION = 1;
