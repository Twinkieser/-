#!/usr/bin/env node
/**
 * Automated Acceptance Test Script for ClientDesk
 * Verifies the 7-step core scenario and negative checks
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
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function run() {
  console.log('='.repeat(70));
  console.log('   CLIENTDESK: ЗАПУСК АВТОМАТИЗИРОВАННОГО ПРИЁМОЧНОГО СЦЕНАРИЯ');
  console.log('='.repeat(70));

  let passed = 0;
  let total = 0;

  async function testStep(num, name, fn) {
    total++;
    process.stdout.write(`[Шаг ${num}] ${name}... `);
    try {
      const msg = await fn();
      console.log(`\x1b[32m✔ УСПЕШНО\x1b[0m (${msg})`);
      passed++;
    } catch (e) {
      console.log(`\x1b[31m✖ ОШИБКА\x1b[0m: ${e.message}`);
    }
  }

  let managerToken = '';
  let executorToken = '';
  let clientId = 0;
  let ticketId = 0;
  let ticketNum = 0;

  // 0. Login Manager & Executor
  await testStep('0.1', 'Вход менеджера (admin/admin123)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login: 'admin', password: 'admin123' })
    });
    if (res.status !== 200 || !res.data.token) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    managerToken = res.data.token;
    return `JWT токен получен, роль: ${res.data.role}`;
  });

  await testStep('0.2', 'Вход исполнителя (ivan/ivan123)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login: 'ivan', password: 'ivan123' })
    });
    if (res.status !== 200 || !res.data.token) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    executorToken = res.data.token;
    return `JWT токен получен, роль: ${res.data.role}`;
  });

  // 1. Manager adds client and creates ticket
  await testStep('1', 'Менеджер добавляет клиента и регистрирует заявку', async () => {
    const cRes = await request('/clients', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        name: 'ООО «БалтТранс Автоматика»',
        contactPerson: 'Алексей Миронов',
        phone: '+7 812 555-44-33',
        email: 'alex@balttrans.ru'
      })
    });
    if (cRes.status !== 201) throw new Error(`Ошибка создания клиента: ${cRes.status}`);
    clientId = cRes.data.id;

    const tRes = await request('/tickets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        clientId: clientId,
        subject: 'Настройка резервного канала связи LTE',
        description: 'Установить резервный роутер с двумя SIM-картами и настроить VRRP failover',
        priority: 'HIGH',
        serviceTypeId: 4
      })
    });
    if (tRes.status !== 201) throw new Error(`Ошибка создания заявки: ${tRes.status}`);
    ticketId = tRes.data.id;
    ticketNum = tRes.data.number;
    return `Клиент id=${clientId}, Заявка №${ticketNum} со статусом NEW`;
  });

  // 2. Manager assigns employee and dueDate
  await testStep('2', 'Менеджер назначает сотрудника и срок исполнения', async () => {
    const res = await request(`/tickets/${ticketId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        assigneeId: 2, // ivan
        dueDate: '2026-10-25'
      })
    });
    if (res.status !== 200) throw new Error(`Ошибка назначения: ${res.status}`);
    return `Назначен: ${res.data.assigneeName}, срок: ${res.data.dueDate}`;
  });

  // 3. Executor accepts into work
  await testStep('3', 'Исполнитель принимает заявку в работу (NEW -> IN_PROGRESS)', async () => {
    const res = await request(`/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${executorToken}` },
      body: JSON.stringify({ targetStatus: 'IN_PROGRESS' })
    });
    if (res.status !== 200) throw new Error(`Ошибка перехода статуса: ${res.status}`);
    return `Новый статус: ${res.data.status}`;
  });

  // 4. Executor adds comment & result, submits for review
  await testStep('4', 'Исполнитель добавляет комментарий, результат и передает на проверку (IN_PROGRESS -> ON_REVIEW)', async () => {
    const cRes = await request(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${executorToken}` },
      body: JSON.stringify({ text: 'Оборудование протестировано при отключении основного провайдера. Переключение занимает 4 секунды.' })
    });
    if (cRes.status !== 201) throw new Error(`Ошибка комментария: ${cRes.status}`);

    const sRes = await request(`/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${executorToken}` },
      body: JSON.stringify({
        targetStatus: 'ON_REVIEW',
        result: 'Роутер смонтирован, VRRP и watchdog настроены, failover проверен.'
      })
    });
    if (sRes.status !== 200) throw new Error(`Ошибка статуса: ${sRes.status}`);
    return `Статус: ${sRes.data.status}, комментарий и результат зафиксированы`;
  });

  // 5. Manager checks and closes
  await testStep('5', 'Менеджер проверяет и закрывает заявку (ON_REVIEW -> CLOSED)', async () => {
    const res = await request(`/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ targetStatus: 'CLOSED' })
    });
    if (res.status !== 200) throw new Error(`Ошибка закрытия: ${res.status}`);
    return `Статус: ${res.data.status}, дата закрытия: ${res.data.closedAt}`;
  });

  // 6. Search & History
  await testStep('6', 'Заявка находится через поиск, видна полная история аудита', async () => {
    const sRes = await request(`/tickets?search=LTE`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    if (sRes.status !== 200 || !sRes.data.content.some(t => t.id === ticketId)) {
      throw new Error('Заявка не найдена в поиске');
    }

    const dRes = await request(`/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    if (dRes.status !== 200 || !dRes.data.history || dRes.data.history.length < 3) {
      throw new Error('История изменений неполная');
    }
    return `Найдена в поиске, шагов истории: ${dRes.data.history.length}`;
  });

  // 7. Report reflection
  await testStep('7', 'Заявка отражается в отчётах и дашборде', async () => {
    const dRes = await request('/reports/dashboard', {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    if (dRes.status !== 200 || dRes.data.closedCount < 1) throw new Error('Дашборд не вернул закрытые заявки');

    const sRes = await request('/reports/summary', {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    if (sRes.status !== 200 || !sRes.data.statusDistribution.CLOSED) throw new Error('Отчет не содержит статус CLOSED');
    return `Дашборд и отчет подтверждены: closedCount = ${dRes.data.closedCount}`;
  });

  // 8. Negative - Executor forbidden on manager action (403)
  await testStep('8', 'НЕГАТИВНЫЙ ТЕСТ: Исполнитель получает 403 на попытку закрыть заявку', async () => {
    const res = await request(`/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${executorToken}` },
      body: JSON.stringify({ targetStatus: 'CLOSED' })
    });
    if (res.status !== 403) throw new Error(`Ожидался статус 403 Forbidden, но получен: ${res.status}`);
    return `Код 403 Forbidden подтвержден: ${res.data.message}`;
  });

  // 9. Negative - Invalid status transition returns 409
  await testStep('9', 'НЕГАТИВНЫЙ ТЕСТ: Недопустимый переход статуса возвращает 409 Conflict', async () => {
    const res = await request(`/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ targetStatus: 'IN_PROGRESS' })
    });
    if (res.status !== 409) throw new Error(`Ожидался статус 409 Conflict, но получен: ${res.status}`);
    return `Код 409 Conflict подтвержден: ${res.data.message}`;
  });

  console.log('='.repeat(70));
  console.log(`ИТОГ ТЕСТИРОВАНИЯ: Пройдено ${passed} из ${total} тестов.`);
  console.log('='.repeat(70));

  if (passed === total) {
    console.log('\x1b[32m✔ ВСЕ ПРИЁМОЧНЫЕ ТЕСТЫ УСПЕШНО ЗАВЕРШЕНЫ!\x1b[0m\n');
  } else {
    console.error('\x1b[31m✖ НЕКОТОРЫЕ ТЕСТЫ ЗАВЕРШИЛИСЬ С ОШИБКАМИ\x1b[0m\n');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Критическая ошибка запуска тестов:', err);
  process.exit(1);
});
