/**
 * APP — состояние прохождения диагностики (флоу из 20 вопросов), обмен с API.
 * Никаких баллов/весов здесь нет: этот файл вообще не знает про scoringMatrix.
 */
import { renderStart, renderQuestion, renderResult } from './screens.js';

const root = document.getElementById('app');

const state = {
  questions: [],
  profileTitles: {},
  index: -1, // -1 = стартовый экран
  answers: {}, // q1..q20, ключи в нижнем регистре
  startedAt: null,
  result: null,
  respondentId: null,
  contactSent: false,
};

function currentQuestion() {
  return state.questions[state.index];
}

function answerKey(question) {
  return question.id.toLowerCase();
}

function getCurrentAnswerForRender(question) {
  const key = answerKey(question);
  if (question.type === 'open_text') {
    return { text: state.answers.q12_text || '', category: state.answers.q12_category || null };
  }
  return state.answers[key];
}

function isAnswered(question) {
  const key = answerKey(question);
  if (question.type === 'multi') {
    return Array.isArray(state.answers[key]) && state.answers[key].length > 0;
  }
  if (question.type === 'open_text') {
    return Boolean(state.answers.q12_category);
  }
  return Boolean(state.answers[key]);
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Request failed: ${res.status}`);
    err.body = body;
    throw err;
  }
  return body;
}

async function init() {
  const [{ questions }, { titles }] = await Promise.all([
    fetchJson('/api/questions'),
    fetchJson('/api/profile-titles'),
  ]);
  state.questions = questions;
  state.profileTitles = titles;
  renderCurrent();
}

function goToStart() {
  state.index = -1;
  renderCurrent();
}

function startQuiz() {
  state.index = 0;
  state.startedAt = new Date().toISOString();
  renderCurrent();
}

function bindStartScreen() {
  document.getElementById('start-btn').addEventListener('click', startQuiz);
}

function bindQuestionScreen(question) {
  const kind = question.type;

  if (kind === 'multi') {
    root.querySelectorAll('input[type="checkbox"]').forEach((el) => {
      el.addEventListener('change', () => {
        const key = answerKey(question);
        const set = new Set(state.answers[key] || []);
        if (el.checked) set.add(el.value);
        else set.delete(el.value);
        state.answers[key] = Array.from(set);
        el.closest('.option').classList.toggle('selected', el.checked);
        clearError();
      });
    });
  } else if (kind === 'open_text') {
    root.querySelectorAll('input[type="radio"]').forEach((el) => {
      el.addEventListener('change', () => {
        state.answers.q12_category = el.value;
        root.querySelectorAll('[data-kind="single"] .option').forEach((o) => o.classList.remove('selected'));
        el.closest('.option').classList.add('selected');
        clearError();
      });
    });
    const textarea = document.getElementById('open-text');
    textarea.addEventListener('input', () => {
      state.answers.q12_text = textarea.value;
    });
  } else {
    root.querySelectorAll('input[type="radio"]').forEach((el) => {
      el.addEventListener('change', () => {
        const key = answerKey(question);
        state.answers[key] = el.value;
        root.querySelectorAll('.option').forEach((o) => o.classList.remove('selected'));
        el.closest('.option').classList.add('selected');
        clearError();
      });
    });
  }

  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.addEventListener('click', goBack);

  document.getElementById('next-btn').addEventListener('click', () => goNext(question));
}

function clearError() {
  const el = document.getElementById('q-error');
  if (el) el.classList.add('hidden');
}

function showError() {
  const el = document.getElementById('q-error');
  if (el) el.classList.remove('hidden');
}

function goBack() {
  if (state.index > 0) {
    state.index -= 1;
    renderCurrent();
  }
}

async function goNext(question) {
  if (!isAnswered(question)) {
    showError();
    return;
  }
  if (state.index === state.questions.length - 1) {
    await submitAnswers();
    return;
  }
  state.index += 1;
  renderCurrent();
}

async function submitAnswers() {
  root.innerHTML = '<div class="spinner">Считаем результат…</div>';
  try {
    const { respondent_id, result } = await fetchJson('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: state.answers, startedAt: state.startedAt }),
    });
    state.respondentId = respondent_id;
    state.result = result;
    renderCurrent();
  } catch (e) {
    root.innerHTML = `<div class="screen"><p class="error-text">Не удалось получить результат: ${e.message}</p><button class="btn-secondary" id="retry-btn">Повторить</button></div>`;
    document.getElementById('retry-btn').addEventListener('click', submitAnswers);
  }
}

function bindResultScreen() {
  const ctaSubmit = document.getElementById('cta-submit');
  if (!ctaSubmit) return;
  ctaSubmit.addEventListener('click', async () => {
    const name = document.getElementById('cta-name').value.trim();
    const contact = document.getElementById('cta-contact').value.trim();
    if (!name || !contact) return;
    try {
      await fetchJson('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respondent_id: state.respondentId, name, contact }),
      });
      state.contactSent = true;
      renderCurrent();
    } catch (e) {
      alert('Не удалось отправить контакт: ' + e.message);
    }
  });
}

function renderCurrent() {
  if (state.index === -1) {
    root.innerHTML = renderStart({ total: state.questions.length });
    bindStartScreen();
    return;
  }

  if (state.result) {
    root.innerHTML = renderResult(state.result, {
      contactSent: state.contactSent,
      profileTitles: state.profileTitles,
    });
    bindResultScreen();
    return;
  }

  const question = currentQuestion();
  root.innerHTML = renderQuestion({
    question,
    index: state.index,
    total: state.questions.length,
    currentAnswer: getCurrentAnswerForRender(question),
    canGoBack: state.index > 0,
  });
  bindQuestionScreen(question);
}

init().catch((e) => {
  root.innerHTML = `<div class="screen"><p class="error-text">Не удалось загрузить анкету: ${e.message}</p></div>`;
});
