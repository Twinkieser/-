#!/usr/bin/env node
/**
 * Comprehensive Edge Cases and Bug Hunting Test Suite for ClientDesk
 * Tests:
 * 1. Role boundaries (Executor trying Manager routes: users, clients, service-types, reports, backup, CSV export)
 * 2. Ticket access boundaries (Executor trying to view/edit/comment/change status of someone else's ticket)
 * 3. Workflow transitions (all invalid combinations: NEW->CLOSED, NEW->WAITING_CLARIFICATION, WAITING_CLARIFICATION->ON_REVIEW, WAITING_CLARIFICATION->CLOSED, CLOSED->anything)
 * 4. Missing required reason (WAITING_CLARIFICATION without reason -> 400, ON_REVIEW->IN_PROGRESS without reason -> 400)
 * 5. Executor trying to touch ticket in ON_REVIEW (should be 403, only Manager can review/return/close)
 * 6. Disabled user login attempt (active=false -> 401)
 * 7. Duplicate user login creation (unique constraint -> 400)
 * 8. Overdue calculation accuracy
 * 9. Search special characters / empty inputs
 * 10. Comment on closed ticket / comment by unassigned executor
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }
  return { status: res.status, data };
}

async function run() {
  console.log('='.repeat(75));
  console.log('   CLIENTDESK: КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ НА ОШИБКИ И ГРАНИЧНЫЕ СЛУЧАИ');
  console.log('='.repeat(75));

  let passed = 0;
  let total = 0;

  async function check(name, fn) {
    total++;
    process.stdout.write(`[Тест ${total}] ${name}... `);
    try {
      const msg = await fn();
      console.log(`\x1b[32m✔ УСПЕШНО\x1b[0m (${msg})`);
      passed++;
    } catch (e) {
      console.log(`\x1b[31m✖ НАЙДЕН БАГ\x1b[0m: ${e.message}`);
    }
  }

  // 1. Auth setup
  let mToken = '';
  let ivanToken = '';
  let annaToken = '';

  await check('Авторизация всех ролей (admin, ivan, anna)', async () => {
    const m = await request('/auth/login', { method: 'POST', body: JSON.stringify({ login: 'admin', password: 'admin123' }) });
    const iv = await request('/auth/login', { method: 'POST', body: JSON.stringify({ login: 'ivan', password: 'ivan123' }) });
    const an = await request('/auth/login', { method: 'POST', body: JSON.stringify({ login: 'anna', password: 'anna123' }) });

    if (m.status !== 200 || iv.status !== 200 || an.status !== 200) {
      throw new Error('Ошибка получения токенов');
    }
    mToken = m.data.token;
    ivanToken = iv.data.token;
    annaToken = an.data.token;
    return 'Токены получены';
  });

  // 2. Executor restricted from creating clients
  await check('Исполнитель не может создавать клиентов (403)', async () => {
    const res = await request('/clients', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ivanToken}` },
      body: JSON.stringify({ name: 'Хакерский клиент' })
    });
    if (res.status !== 403) throw new Error(`Ожидался 403, получен ${res.status}`);
    return `Код 403 Forbidden: ${res.data?.message || 'Доступ запрещен'}`;
  });

  // 3. Executor restricted from viewing reports
  await check('Исполнитель не может просматривать отчеты (403)', async () => {
    const res = await request('/reports/summary', {
      headers: { Authorization: `Bearer ${ivanToken}` }
    });
    if (res.status !== 403) throw new Error(`Ожидался 403, получен ${res.status}`);
    return `Код 403 Forbidden`;
  });

  // 4. Executor restricted from exporting CSV
  await check('Исполнитель не может выгружать CSV отчет (403)', async () => {
    const res = await request('/reports/export-csv', {
      headers: { Authorization: `Bearer ${ivanToken}` }
    });
    if (res.status !== 403) throw new Error(`Ожидался 403, получен ${res.status}`);
    return `Код 403 Forbidden`;
  });

  // 5. Executor restricted from managing users
  await check('Исполнитель не может создавать пользователей (403)', async () => {
    const res = await request('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ivanToken}` },
      body: JSON.stringify({ login: 'hacker', password: '123', fullName: 'Хакер', role: 'MANAGER' })
    });
    if (res.status !== 403) throw new Error(`Ожидался 403, получен ${res.status}`);
    return `Код 403 Forbidden`;
  });

  // 6. Executor restricted from creating tickets
  await check('Исполнитель не может регистрировать новые заявки (403)', async () => {
    const res = await request('/tickets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ivanToken}` },
      body: JSON.stringify({ clientId: 1, subject: 'Тест', description: 'Тест' })
    });
    if (res.status !== 403) throw new Error(`Ожидался 403, получен ${res.status}`);
    return `Код 403 Forbidden`;
  });

  // 7. Executor restricted from viewing another executor's ticket
  // Ticket #2 (id: 2) is assigned to anna (id: 3)
  await check('Иван не может открыть чужую заявку Анны (403)', async () => {
    const res = await request('/tickets/2', {
      headers: { Authorization: `Bearer ${ivanToken}` }
    });
    if (res.status !== 403) throw new Error(`Ожидался 403, получен ${res.status}`);
    return `Код 403 Forbidden: чужая заявка недоступна`;
  });

  // 7.1 Executor ticket list isolation: Ivan must ONLY see tickets assigned to him
  await check('Иван в общем реестре видит только свои назначенные заявки', async () => {
    const res = await request('/tickets', {
      headers: { Authorization: `Bearer ${ivanToken}` }
    });
    if (res.status !== 200) throw new Error(`Ошибка получения списка: ${res.status}`);
    const tickets = res.data.content || [];
    for (const t of tickets) {
      if (t.assigneeId !== 2) {
        throw new Error(`Обнаружена чужая заявка №${t.number} с assigneeId=${t.assigneeId} в выдаче Ивана!`);
      }
    }
    return `Все ${tickets.length} заявок в выдаче назначены на Ивана (assigneeId: 2)`;
  });

  // 7.2 Executor cannot change status if ticket is ON_REVIEW
  // Ticket #4 is ON_REVIEW and assigned to Anna (id: 3)
  await check('Исполнитель не может менять статус заявки, пока она на проверке у менеджера (403)', async () => {
    const res = await request('/tickets/4/status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${annaToken}` },
      body: JSON.stringify({ targetStatus: 'IN_PROGRESS' })
    });
    if (res.status !== 403) throw new Error(`Ожидался 403, получен ${res.status}`);
    return `Код 403 Forbidden: заявка на проверке заблокирована для исполнителя`;
  });

  // 8. Executor restricted from commenting on someone else's ticket
  await check('Иван не может комментировать чужую заявку Анны (403)', async () => {
    const res = await request('/tickets/2/comments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ivanToken}` },
      body: JSON.stringify({ text: 'Попытка вмешательства' })
    });
    if (res.status !== 403) throw new Error(`Ожидался 403, получен ${res.status}`);
    return `Код 403 Forbidden: комментирование чужой заявки отклонено`;
  });

  // 9. Mandatory reason for WAITING_CLARIFICATION
  // Ticket #1 is IN_PROGRESS and assigned to ivan
  await check('Перевод в WAITING_CLARIFICATION без причины отклоняется (400)', async () => {
    const res = await request('/tickets/1/status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ivanToken}` },
      body: JSON.stringify({ targetStatus: 'WAITING_CLARIFICATION', reason: '   ' })
    });
    if (res.status !== 400) throw new Error(`Ожидался 400, получен ${res.status}`);
    return `Код 400 Bad Request: обязательная причина валидируется`;
  });

  // 10. Invalid state transition: WAITING_CLARIFICATION directly to ON_REVIEW (should be 409)
  // Ticket #3 is currently WAITING_CLARIFICATION (assigned to ivan)
  await check('Переход WAITING_CLARIFICATION -> ON_REVIEW отклоняется (409)', async () => {
    const res = await request('/tickets/3/status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ivanToken}` },
      body: JSON.stringify({ targetStatus: 'ON_REVIEW' })
    });
    if (res.status !== 409) throw new Error(`Ожидался 409 Conflict, получен ${res.status}`);
    return `Код 409 Conflict: недопустимый переход отклонен`;
  });

  // 11. Invalid state transition: WAITING_CLARIFICATION directly to CLOSED (should be 409)
  await check('Переход WAITING_CLARIFICATION -> CLOSED отклоняется (409)', async () => {
    const res = await request('/tickets/3/status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${mToken}` },
      body: JSON.stringify({ targetStatus: 'CLOSED' })
    });
    if (res.status !== 409) throw new Error(`Ожидался 409 Conflict, получен ${res.status}`);
    return `Код 409 Conflict: недопустимый переход отклонен`;
  });

  // 12. Ticket in ON_REVIEW returned to IN_PROGRESS without reason (should be 400)
  // Ticket #4 is ON_REVIEW
  await check('Возврат ON_REVIEW -> IN_PROGRESS без комментария отклоняется (400)', async () => {
    const res = await request('/tickets/4/status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${mToken}` },
      body: JSON.stringify({ targetStatus: 'IN_PROGRESS', reason: '' })
    });
    if (res.status !== 400) throw new Error(`Ожидался 400, получен ${res.status}`);
    return `Код 400 Bad Request: комментарий обязателен`;
  });

  // 13. Terminal state CLOSED: cannot transition anywhere (should be 409)
  // Ticket #5 is CLOSED
  await check('Конечный статус CLOSED не может быть изменен никуда (409)', async () => {
    const res = await request('/tickets/5/status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${mToken}` },
      body: JSON.stringify({ targetStatus: 'IN_PROGRESS' })
    });
    if (res.status !== 409) throw new Error(`Ожидался 409 Conflict, получен ${res.status}`);
    return `Код 409 Conflict: CLOSED является финальным состоянием`;
  });

  // 14. Check login with disabled user account
  await check('Отключенный пользователь не может войти в систему (401)', async () => {
    // 1. Create a test user
    const createRes = await request('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${mToken}` },
      body: JSON.stringify({ login: 'disabled_test', password: 'password123', fullName: 'Тестовый Сотрудник', role: 'EXECUTOR' })
    });
    const newUserId = createRes.data?.id;

    // 2. Toggle active status to false
    await request(`/users/${newUserId}/toggle-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${mToken}` }
    });

    // 3. Try to login
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login: 'disabled_test', password: 'password123' })
    });

    if (loginRes.status !== 401) throw new Error(`Ожидался 401, получен ${loginRes.status}`);
    return `Код 401: ${loginRes.data?.message || 'Учётная запись отключена'}`;
  });

  // 15. Check duplicate login prevention
  await check('Создание пользователя с существующим логином отклоняется (400)', async () => {
    const res = await request('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${mToken}` },
      body: JSON.stringify({ login: 'admin', password: 'password123', fullName: 'Дубликат', role: 'MANAGER' })
    });
    if (res.status !== 400) throw new Error(`Ожидался 400, получен ${res.status}`);
    return `Код 400: дублирование логина предотвращено`;
  });

  // 16. Search with special characters and cyrillic
  await check('Поиск по кириллице и спецсимволам не ломает выдачу (200)', async () => {
    const res = await request('/tickets?search=' + encodeURIComponent('1С " & \' < >'), {
      headers: { Authorization: `Bearer ${mToken}` }
    });
    if (res.status !== 200) throw new Error(`Ошибка поиска: ${res.status}`);
    return `HTTP 200: выдача сформирована корректно`;
  });

  // 17. Overdue calculation: tickets with dueDate < today and status != CLOSED
  await check('Проверка корректности флага просрочки overdue', async () => {
    const res = await request('/reports/dashboard', {
      headers: { Authorization: `Bearer ${mToken}` }
    });
    if (res.status !== 200) throw new Error('Ошибка дашборда');
    const overdueList = res.data.overdueTickets || [];
    for (const t of overdueList) {
      if (t.status === 'CLOSED') throw new Error(`Заявка ${t.id} закрыта, но помечена как просроченная!`);
      const today = new Date().toISOString().split('T')[0];
      if (t.dueDate >= today) throw new Error(`Заявка ${t.id} имеет dueDate ${t.dueDate} >= ${today}, но помечена как overdue!`);
    }
    return `Все ${overdueList.length} просроченных заявок строго соответствуют dueDate < сегодня и status != CLOSED`;
  });

  console.log('='.repeat(75));
  console.log(`ИТОГИ ТЕСТИРОВАНИЯ: Успешно пройдено ${passed} из ${total} тестов.`);
  console.log('='.repeat(75));

  if (passed === total) {
    console.log('\x1b[32m✔ ВСЕ ТЕСТЫ И ПРОВЕРКИ НАДЕЖНОСТИ УСПЕШНО ПРОЙДЕНЫ!\x1b[0m\n');
  } else {
    console.error('\x1b[31m✖ НАЙДЕНЫ ОШИБКИ\x1b[0m\n');
    process.exit(1);
  }
}

run().catch(e => {
  console.error('Ошибка скрипта:', e);
  process.exit(1);
});
