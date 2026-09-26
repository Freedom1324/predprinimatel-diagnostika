/**
 * SCREENS — чистые функции рендера DOM-строк по состоянию.
 * Никаких баллов/весов здесь нет и быть не может — только тексты вопросов,
 * которые пришли с сервера через /api/questions, и результат, который пришёл
 * уже готовым с /api/submit.
 */

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function renderStart({ total }) {
  return `
    <div class="screen">
      <div class="brand">Диагностика предпринимателя</div>
      <h1>Узнайте, что сейчас сильнее всего тормозит ваш бизнес</h1>
      <p class="lead">${total} коротких вопросов, 5–7 минут. В конце — персональный разбор и рекомендация, с чего начать.</p>
      <div class="nav-row">
        <button class="btn-primary" id="start-btn">Начать диагностику</button>
      </div>
    </div>
  `;
}

function renderSingleOptions(question, selectedValue) {
  return `
    <div class="options" data-kind="single">
      ${question.options
        .map(
          (opt) => `
        <label class="option ${selectedValue === opt ? 'selected' : ''}">
          <input type="radio" name="q" value="${escapeHtml(opt)}" ${selectedValue === opt ? 'checked' : ''} />
          <span>${escapeHtml(opt)}</span>
        </label>
      `
        )
        .join('')}
    </div>
  `;
}

function renderMultiOptions(question, selectedValues) {
  const selected = selectedValues || [];
  return `
    <div class="options" data-kind="multi">
      ${question.options
        .map(
          (opt) => `
        <label class="option ${selected.includes(opt) ? 'selected' : ''}">
          <input type="checkbox" value="${escapeHtml(opt)}" ${selected.includes(opt) ? 'checked' : ''} />
          <span>${escapeHtml(opt)}</span>
        </label>
      `
        )
        .join('')}
    </div>
  `;
}

function renderOpenText(question, currentAnswer) {
  const text = currentAnswer?.text || '';
  const category = currentAnswer?.category || null;
  return `
    <textarea id="open-text" placeholder="Опишите своими словами (необязательно)">${escapeHtml(text)}</textarea>
    <p class="lead" style="margin-top:10px;">Выберите ближайшую категорию:</p>
    ${renderSingleOptions(question, category)}
  `;
}

export function renderQuestion({ question, index, total, currentAnswer, canGoBack }) {
  const progressPct = Math.round((index / total) * 100);

  let body;
  if (question.type === 'multi') {
    body = renderMultiOptions(question, currentAnswer);
  } else if (question.type === 'open_text') {
    body = renderOpenText(question, currentAnswer);
  } else {
    body = renderSingleOptions(question, currentAnswer);
  }

  return `
    <div class="screen">
      <div class="progress-wrap">
        <div class="progress-bar"><div class="progress-fill" style="width:${progressPct}%"></div></div>
        <div class="progress-label">Вопрос ${index + 1} из ${total}</div>
      </div>
      <h2>${escapeHtml(question.text)}</h2>
      ${body}
      <div class="error-text hidden" id="q-error">Пожалуйста, выберите вариант ответа.</div>
      <div class="nav-row">
        ${canGoBack ? '<button class="btn-secondary" id="back-btn">Назад</button>' : ''}
        <button class="btn-primary" id="next-btn">${index === total - 1 ? 'Показать результат' : 'Далее'}</button>
      </div>
    </div>
  `;
}

function renderIndexBar(label, value) {
  return `
    <div class="index-row">
      <span>${escapeHtml(label)}</span><span>${value}%</span>
    </div>
    <div class="index-bar-bg"><div class="index-bar-fill" style="width:${Math.min(value, 100)}%"></div></div>
  `;
}

export function renderResult(result, { contactSent, profileTitles } = {}) {
  const signals = (result.signals || [])
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join('');

  const secondary = result.secondaryProfile
    ? `<p class="lead">Также заметна вторичная зона: <strong>${escapeHtml(result.secondaryProfile.title)}</strong>.</p>`
    : '';

  const offerText = Array.isArray(result.offer) ? result.offer.join(' + ') : result.offer;

  const ctaBlock = result.offer
    ? contactSent
      ? `<div class="card"><p class="lead">Спасибо! Мы свяжемся с вами по указанному контакту.</p></div>`
      : `
        <div class="card" id="cta-card">
          <h2>Получить разбор</h2>
          <p class="lead">Рекомендуемый формат: ${escapeHtml(offerText)}</p>
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">
            <input type="text" id="cta-name" placeholder="Ваше имя" />
            <input type="text" id="cta-contact" placeholder="Email или Telegram" />
          </div>
          <div class="nav-row">
            <button class="btn-primary" id="cta-submit">Отправить</button>
          </div>
        </div>
      `
    : '';

  return `
    <div class="screen">
      <div class="badge">Результат</div>
      <h1>${escapeHtml(result.title)}</h1>
      <p class="lead">${escapeHtml(result.explanation)}</p>

      ${signals ? `<div class="card"><h2>Что на это указывает</h2><ul class="signal-list">${signals}</ul></div>` : ''}

      <div class="card">
        <h2>С чего начать</h2>
        <p class="lead">${escapeHtml(result.firstStep)}</p>
        ${secondary}
      </div>

      <div class="card">
        <h2>Профиль по зонам</h2>
        ${Object.entries(result.indexes)
          .map(([code, value]) => renderIndexBar((profileTitles && profileTitles[code]) || code, value))
          .join('')}
      </div>

      ${ctaBlock}
    </div>
  `;
}
