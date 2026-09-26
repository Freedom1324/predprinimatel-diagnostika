/**
 * EMAIL NOTIFIER
 *
 * Отправляет письмо владельцу сервиса при каждой новой заявке (CTA "Получить разбор").
 * Использует Resend (https://resend.com) через обычный fetch — без дополнительных
 * npm-зависимостей.
 *
 * Настройка (переменные окружения, задаются в Render → Environment):
 *   RESEND_API_KEY   — ключ API из аккаунта Resend (обязателен, иначе письма не шлются)
 *   NOTIFY_TO_EMAIL  — куда слать уведомления (email, которым зарегистрирован Resend)
 *   NOTIFY_FROM_EMAIL — необязательно; по умолчанию Resend позволяет слать с
 *                       "onboarding@resend.dev" без верификации домена
 *
 * Если RESEND_API_KEY не задан — функция просто ничего не делает (не ломает основной
 * сценарий сохранения заявки).
 */

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendContactNotification({ name, contact, record }) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.NOTIFY_TO_EMAIL;
  const fromEmail = process.env.NOTIFY_FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey || !toEmail) {
    // Уведомления не настроены — молча пропускаем, заявка уже сохранена в базе.
    return { sent: false, reason: 'not_configured' };
  }

  const profileTitle = record?.primary_profile || '—';
  const status = record?.result_status || '—';

  const subject = `Новая заявка с диагностики: ${name}`;
  const html = `
    <h2>Новая заявка с диагностики предпринимателя</h2>
    <p><strong>Имя:</strong> ${escapeHtml(name)}</p>
    <p><strong>Контакт:</strong> ${escapeHtml(contact)}</p>
    <p><strong>Ведущий профиль:</strong> ${escapeHtml(profileTitle)}</p>
    <p><strong>Статус результата:</strong> ${escapeHtml(status)}</p>
    <p><strong>ID респондента:</strong> ${escapeHtml(record?.respondent_id || '—')}</p>
    <p><strong>Дата:</strong> ${new Date().toLocaleString('ru-RU')}</p>
  `;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('Resend API error:', res.status, errText);
      return { sent: false, reason: 'api_error' };
    }

    return { sent: true };
  } catch (e) {
    console.error('Email notification failed:', e);
    return { sent: false, reason: 'network_error' };
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
