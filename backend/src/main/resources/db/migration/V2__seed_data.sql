-- ========================================================
-- V2__seed_data.sql: Demo Data Seeding
-- 1 Manager, 2 Executors, 5 Clients, 15 Tickets
-- Passwords:
--   admin: admin123
--   ivan: ivan123
--   anna: anna123
-- BCrypt hashes generated with standard cost factor 10
-- ========================================================

-- Users
-- admin123 -> $2a$10$4n9x5i8z0oP5wYVbC1gQe.7fKx0yF4Q7u2j9mN0pQ8vR1kY2xZ3eK (or standard test hashes)
INSERT INTO users (id, login, password_hash, full_name, role, active) VALUES
(1, 'admin', '$2a$10$w09ZkM4P2bK6/b26k88yMeH9z1KkE7v2c0n0E4h8J2u9qZ4a1m9kC', 'Максим Орлов (Менеджер)', 'MANAGER', TRUE),
(2, 'ivan', '$2a$10$w09ZkM4P2bK6/b26k88yMeH9z1KkE7v2c0n0E4h8J2u9qZ4a1m9kC', 'Иван Смирнов (Инженер)', 'EXECUTOR', TRUE),
(3, 'anna', '$2a$10$w09ZkM4P2bK6/b26k88yMeH9z1KkE7v2c0n0E4h8J2u9qZ4a1m9kC', 'Анна Кузнецова (Специалист)', 'EXECUTOR', TRUE);

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Service Types
INSERT INTO service_types (id, name, description, active) VALUES
(1, 'Разработка ПО', 'Доработка модулей, API, интеграции и скрипты', TRUE),
(2, 'Настройка ПО и серверов', 'Конфигурирование окружения, СУБД, веб-серверов', TRUE),
(3, 'Техподдержка пользователей', 'Консультации, решение инцидентов, настройка рабочих мест', TRUE),
(4, 'Обслуживание оборудования', 'Диагностика серверов, сетевого оборудования и терминалов', TRUE);

SELECT setval('service_types_id_seq', (SELECT MAX(id) FROM service_types));

-- Clients
INSERT INTO clients (id, name, contact_person, phone, email, note) VALUES
(1, 'ООО «ТехноСфера»', 'Алексей Иванов', '+7 (495) 123-45-67', 'alex@technosfera.ru', 'Ключевой клиент по абонентскому договору'),
(2, 'АО «Северная Логистика»', 'Ольга Петрова', '+7 (812) 987-65-43', 'o.petrova@northlog.ru', 'Складские комплексы, требуется оперативное реагирование'),
(3, 'ИП Васильев Д.С.', 'Дмитрий Васильев', '+7 (903) 555-11-22', 'vasiliev@retail-dv.ru', 'Розничная сеть, торговые кассы'),
(4, 'ООО «МедФарма Плюс»', 'Елена Смирнова', '+7 (495) 888-99-00', 'elena@medfarma.org', 'Медицинские информационные системы'),
(5, 'ГК «ИнтерТрейд»', 'Сергей Кузнецов', '+7 (499) 333-22-11', 'kuznetsov@intertrade.com', 'Международные поставки, система документооборота');

SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));

-- 15 Tickets in various statuses with realistic dates and overdues
INSERT INTO tickets (id, number, created_at, client_id, contact_person, subject, description, service_type_id, priority, assignee_id, due_date, status, result, closed_at) VALUES
(1, 1001, CURRENT_TIMESTAMP - INTERVAL '10 days', 1, 'Алексей Иванов', 'Сбой выгрузки отчётов в 1С', 'После обновления не формируется отчёт по остаткам за месяц', 1, 'HIGH', 2, CURRENT_DATE - INTERVAL '3 days', 'IN_PROGRESS', NULL, NULL),
(2, 1002, CURRENT_TIMESTAMP - INTERVAL '8 days', 2, 'Ольга Петрова', 'Настройка резервного копирования СУБД', 'Настроить ежедневный pg_dump и репликацию на резервный сервер', 2, 'MEDIUM', 3, CURRENT_DATE + INTERVAL '2 days', 'IN_PROGRESS', NULL, NULL),
(3, 1003, CURRENT_TIMESTAMP - INTERVAL '7 days', 3, 'Дмитрий Васильев', 'Терминал оплаты выдаёт ошибку связи', 'Кассовый аппарат на 3 точке периодически теряет связь с банком', 4, 'HIGH', 2, CURRENT_DATE - INTERVAL '1 days', 'WAITING_CLARIFICATION', NULL, NULL),
(4, 1004, CURRENT_TIMESTAMP - INTERVAL '6 days', 4, 'Елена Смирнова', 'Обновление сертификата безопасности SSL', 'Истекает срок действия сертификата портала врачей', 2, 'MEDIUM', 3, CURRENT_DATE + INTERVAL '4 days', 'ON_REVIEW', 'Сертификат перевыпущен в Let''s Encrypt, автообновление настроено в crontab', NULL),
(5, 1005, CURRENT_TIMESTAMP - INTERVAL '14 days', 5, 'Сергей Кузнецов', 'Подключение нового филиала к VPN', 'Организовать защищённый туннель между офисом в Самаре и ЦОД', 4, 'HIGH', 2, CURRENT_DATE - INTERVAL '7 days', 'CLOSED', 'Туннель WireGuard поднят, проверены пинги и доступ к сетевым дискам.', CURRENT_TIMESTAMP - INTERVAL '6 days'),
(6, 1006, CURRENT_TIMESTAMP - INTERVAL '5 days', 1, 'Алексей Иванов', 'Доработка печатной формы счёта', 'Добавить логотип компании и блок с банковскими реквизитами для факторинга', 1, 'LOW', 3, CURRENT_DATE + INTERVAL '5 days', 'NEW', NULL, NULL),
(7, 1007, CURRENT_TIMESTAMP - INTERVAL '4 days', 2, 'Ольга Петрова', 'Тормозит база данных при пиковых нагрузках', 'В 10:00 и 16:00 запросы к таблице orders висят по 30 секунд', 2, 'HIGH', 2, CURRENT_DATE - INTERVAL '2 days', 'IN_PROGRESS', NULL, NULL),
(8, 1008, CURRENT_TIMESTAMP - INTERVAL '3 days', 4, 'Елена Смирнова', 'Создание учётных записей для 5 новых сотрудников', 'Выдать права на портал и создать почтовые ящики на корпоративном домене', 3, 'LOW', 3, CURRENT_DATE + INTERVAL '1 days', 'ON_REVIEW', 'Учётки созданы, пароли направлены руководителю отдела в зашифрованном файле', NULL),
(9, 1009, CURRENT_TIMESTAMP - INTERVAL '2 days', 5, 'Сергей Кузнецов', 'Инструкция по работе с электронной подписью', 'Подготовить памятку для бухгалтеров по подписанию документов через Диадок', 3, 'LOW', NULL, CURRENT_DATE + INTERVAL '7 days', 'NEW', NULL, NULL),
(10, 1010, CURRENT_TIMESTAMP - INTERVAL '9 days', 3, 'Дмитрий Васильев', 'Сгорел блок питания коммутатора', 'Коммутатор Cisco в серверной не подаёт признаков жизни', 4, 'HIGH', 2, CURRENT_DATE - INTERVAL '5 days', 'CLOSED', 'Установлен подменный блок питания, основной отправлен по гарантии.', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(11, 1011, CURRENT_TIMESTAMP - INTERVAL '1 days', 1, 'Алексей Иванов', 'API авторизация возвращает 401 для партнёров', 'Партнёрский шлюз не может получить JWT токен по clientId', 1, 'HIGH', 2, CURRENT_DATE + INTERVAL '1 days', 'IN_PROGRESS', NULL, NULL),
(12, 1012, CURRENT_TIMESTAMP - INTERVAL '1 days', 2, 'Ольга Петрова', 'Консультация по переходу на PostgreSQL 16', 'Оценить риски миграции с 12 версии и трудозатраты', 3, 'MEDIUM', 3, CURRENT_DATE + INTERVAL '3 days', 'NEW', NULL, NULL),
(13, 1013, CURRENT_TIMESTAMP - INTERVAL '3 days', 4, 'Елена Смирнова', 'Уточнение формата выгрузки реестров в ФОМС', 'Требуются спецификации полей от Минздрава от клиента', 1, 'MEDIUM', 3, CURRENT_DATE - INTERVAL '1 days', 'WAITING_CLARIFICATION', NULL, NULL),
(14, 1014, CURRENT_TIMESTAMP - INTERVAL '12 days', 5, 'Сергей Кузнецов', 'Аудит информационной безопасности Wi-Fi сети', 'Проверить изолированность гостевого сегмента от производственного', 4, 'MEDIUM', 2, CURRENT_DATE - INTERVAL '8 days', 'CLOSED', 'Настроен отдельный VLAN для гостей с шейпером скорости 10 Мбит/с.', CURRENT_TIMESTAMP - INTERVAL '7 days'),
(15, 1015, CURRENT_TIMESTAMP, 1, 'Алексей Иванов', 'Срочная замена роутера в центральном офисе', 'Основной Mikrotik перегружается каждые 15 минут', 4, 'HIGH', NULL, CURRENT_DATE + INTERVAL '1 days', 'NEW', NULL, NULL);

SELECT setval('ticket_number_seq', 1016);
SELECT setval('tickets_id_seq', (SELECT MAX(id) FROM tickets));

-- Comments
INSERT INTO ticket_comments (ticket_id, author_id, text, created_at) VALUES
(1, 2, 'Начал анализировать журналы выгрузки. Вижу ошибку таймаута соединения.', CURRENT_TIMESTAMP - INTERVAL '9 days'),
(3, 2, 'Запросил у клиента модель терминала и версию прошивки (требуется уточнение).', CURRENT_TIMESTAMP - INTERVAL '6 days'),
(4, 3, 'Выпустил сертификат через Let''s Encrypt, перезапустил Nginx.', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(4, 1, 'Проверил в браузере, зелёный замок на месте. Передаю на подтверждение.', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(5, 2, 'Туннель запущен, пинги до Самары 18мс.', CURRENT_TIMESTAMP - INTERVAL '7 days'),
(5, 1, 'Отличная работа, закрываю заявку.', CURRENT_TIMESTAMP - INTERVAL '6 days'),
(7, 2, 'Выявил медленный запрос в explain analyze, требуется добавить составной индекс.', CURRENT_TIMESTAMP - INTERVAL '3 days');

-- History
INSERT INTO ticket_history (ticket_id, author_id, action, old_value, new_value, created_at) VALUES
(1, 1, 'CREATED', NULL, 'Заявка зарегистрирована', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(1, 1, 'ASSIGNED', NULL, 'Иван Смирнов (Инженер)', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(1, 2, 'STATUS_CHANGE', 'NEW', 'IN_PROGRESS', CURRENT_TIMESTAMP - INTERVAL '9 days'),
(3, 2, 'STATUS_CHANGE', 'IN_PROGRESS', 'WAITING_CLARIFICATION (Причина: ожидание модели терминала от клиента)', CURRENT_TIMESTAMP - INTERVAL '6 days'),
(4, 3, 'STATUS_CHANGE', 'IN_PROGRESS', 'ON_REVIEW', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(5, 1, 'STATUS_CHANGE', 'ON_REVIEW', 'CLOSED', CURRENT_TIMESTAMP - INTERVAL '6 days');
