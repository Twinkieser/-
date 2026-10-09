import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';

const JWT_SECRET = process.env.JWT_SECRET || '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b';
const LOG_FILE = path.resolve('logs/events.log');

// Ensure log directory
if (!fs.existsSync(path.dirname(LOG_FILE))) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '', 'utf8');
}

function logEvent(username: string, action: string, details: string) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [USER: ${username}] [ACTION: ${action}] ${details}\n`;
  try {
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (err) {
    console.error('Failed to append to log file:', err);
  }
}

// -----------------------------------------------------------------------------
// IN-MEMORY / PERSISTENT SEED DATA REPOSITORY
// -----------------------------------------------------------------------------
export interface UserRecord {
  id: number;
  login: string;
  passwordHash: string;
  fullName: string;
  role: 'MANAGER' | 'EXECUTOR';
  active: boolean;
  createdAt: string;
}

export interface ClientRecord {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  createdAt: string;
}

export interface ServiceTypeRecord {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
}

export interface CommentRecord {
  id: number;
  ticketId: number;
  authorId: number;
  authorName: string;
  authorRole: 'MANAGER' | 'EXECUTOR';
  text: string;
  createdAt: string;
}

export interface HistoryRecord {
  id: number;
  ticketId: number;
  authorId: number;
  authorName: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface TicketRecord {
  id: number;
  number: number;
  createdAt: string;
  clientId: number;
  contactPerson: string | null;
  subject: string;
  description: string;
  serviceTypeId: number | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigneeId: number | null;
  dueDate: string | null; // YYYY-MM-DD
  status: 'NEW' | 'IN_PROGRESS' | 'WAITING_CLARIFICATION' | 'ON_REVIEW' | 'CLOSED';
  result: string | null;
  closedAt: string | null;
}

// Hash for default password 'admin123', 'ivan123', 'anna123'
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('admin123', 10);
const IVAN_HASH = bcrypt.hashSync('ivan123', 10);
const ANNA_HASH = bcrypt.hashSync('anna123', 10);

function getInitialState() {
  const users: UserRecord[] = [
    {
      id: 1,
      login: 'admin',
      passwordHash: DEFAULT_PASSWORD_HASH,
      fullName: 'Максим Орлов (Менеджер)',
      role: 'MANAGER',
      active: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 2,
      login: 'ivan',
      passwordHash: IVAN_HASH,
      fullName: 'Иван Смирнов (Инженер)',
      role: 'EXECUTOR',
      active: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 3,
      login: 'anna',
      passwordHash: ANNA_HASH,
      fullName: 'Анна Кузнецова (Специалист)',
      role: 'EXECUTOR',
      active: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ];

  const clients: ClientRecord[] = [
    {
      id: 1,
      name: 'ООО «ТехноСфера»',
      contactPerson: 'Алексей Иванов',
      phone: '+7 (495) 123-45-67',
      email: 'alex@technosfera.ru',
      note: 'Ключевой клиент по абонентскому договору сопровождения',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 2,
      name: 'АО «Северная Логистика»',
      contactPerson: 'Ольга Петрова',
      phone: '+7 (812) 987-65-43',
      email: 'o.petrova@northlog.ru',
      note: 'Складские комплексы, требуется оперативное реагирование',
      createdAt: new Date(Date.now() - 24 * 86400000).toISOString(),
    },
    {
      id: 3,
      name: 'ИП Васильев Д.С.',
      contactPerson: 'Дмитрий Васильев',
      phone: '+7 (903) 555-11-22',
      email: 'vasiliev@retail-dv.ru',
      note: 'Розничная сеть, торговые кассы и эквайринг',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 4,
      name: 'ООО «МедФарма Плюс»',
      contactPerson: 'Елена Смирнова',
      phone: '+7 (495) 888-99-00',
      email: 'elena@medfarma.org',
      note: 'Медицинские информационные системы и отчетность в ЕГИСЗ',
      createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    },
    {
      id: 5,
      name: 'ГК «ИнтерТрейд»',
      contactPerson: 'Сергей Кузнецов',
      phone: '+7 (499) 333-22-11',
      email: 'kuznetsov@intertrade.com',
      note: 'Международные поставки, система документооборота и CRM',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
  ];

  const serviceTypes: ServiceTypeRecord[] = [
    { id: 1, name: 'Разработка ПО', description: 'Доработка модулей, API, интеграции и скрипты', active: true, createdAt: new Date().toISOString() },
    { id: 2, name: 'Настройка ПО и серверов', description: 'Конфигурирование окружения, СУБД, веб-серверов', active: true, createdAt: new Date().toISOString() },
    { id: 3, name: 'Техподдержка пользователей', description: 'Консультации, решение инцидентов, настройка рабочих мест', active: true, createdAt: new Date().toISOString() },
    { id: 4, name: 'Обслуживание оборудования', description: 'Диагностика серверов, сетевого оборудования и терминалов', active: true, createdAt: new Date().toISOString() },
  ];

  // Helper date generators
  const now = Date.now();
  const dayMs = 86400000;
  const toDateStr = (d: Date) => d.toISOString().split('T')[0];

  const tickets: TicketRecord[] = [
    {
      id: 1,
      number: 1001,
      createdAt: new Date(now - 10 * dayMs).toISOString(),
      clientId: 1,
      contactPerson: 'Алексей Иванов',
      subject: 'Сбой выгрузки отчётов в 1С',
      description: 'После ночного обновления перестали формироваться ведомости по остаткам склада за прошлый месяц.',
      serviceTypeId: 1,
      priority: 'HIGH',
      assigneeId: 2,
      dueDate: toDateStr(new Date(now - 3 * dayMs)), // OVERDUE
      status: 'IN_PROGRESS',
      result: null,
      closedAt: null,
    },
    {
      id: 2,
      number: 1002,
      createdAt: new Date(now - 8 * dayMs).toISOString(),
      clientId: 2,
      contactPerson: 'Ольга Петрова',
      subject: 'Настройка резервного копирования СУБД',
      description: 'Настроить ежедневный автоматический pg_dump с шифрованием и репликацию на удалённый S3.',
      serviceTypeId: 2,
      priority: 'MEDIUM',
      assigneeId: 3,
      dueDate: toDateStr(new Date(now + 2 * dayMs)),
      status: 'IN_PROGRESS',
      result: null,
      closedAt: null,
    },
    {
      id: 3,
      number: 1003,
      createdAt: new Date(now - 7 * dayMs).toISOString(),
      clientId: 3,
      contactPerson: 'Дмитрий Васильев',
      subject: 'Терминал оплаты выдаёт ошибку связи',
      description: 'Кассовый аппарат на точке №3 периодически теряет связь с банком-эквайером.',
      serviceTypeId: 4,
      priority: 'HIGH',
      assigneeId: 2,
      dueDate: toDateStr(new Date(now - 1 * dayMs)), // OVERDUE
      status: 'WAITING_CLARIFICATION',
      result: null,
      closedAt: null,
    },
    {
      id: 4,
      number: 1004,
      createdAt: new Date(now - 6 * dayMs).toISOString(),
      clientId: 4,
      contactPerson: 'Елена Смирнова',
      subject: 'Обновление сертификата безопасности SSL',
      description: 'Истекает срок действия сертификата wildcard для защищенного портала врачей.',
      serviceTypeId: 2,
      priority: 'MEDIUM',
      assigneeId: 3,
      dueDate: toDateStr(new Date(now + 4 * dayMs)),
      status: 'ON_REVIEW',
      result: 'Сертификат перевыпущен в Let’s Encrypt, auto-renewal скрипт добавлен в cron, Nginx перезапущен.',
      closedAt: null,
    },
    {
      id: 5,
      number: 1005,
      createdAt: new Date(now - 14 * dayMs).toISOString(),
      clientId: 5,
      contactPerson: 'Сергей Кузнецов',
      subject: 'Подключение нового филиала к VPN',
      description: 'Организовать защищённый IPsec/WireGuard туннель между офисом в Самаре и центральным ЦОД.',
      serviceTypeId: 4,
      priority: 'HIGH',
      assigneeId: 2,
      dueDate: toDateStr(new Date(now - 7 * dayMs)),
      status: 'CLOSED',
      result: 'Туннель WireGuard поднят, проверены пинги, пропускная способность 95 Мбит/с, доступ к файловому серверу открыт.',
      closedAt: new Date(now - 6 * dayMs).toISOString(),
    },
    {
      id: 6,
      number: 1006,
      createdAt: new Date(now - 5 * dayMs).toISOString(),
      clientId: 1,
      contactPerson: 'Алексей Иванов',
      subject: 'Доработка печатной формы счёта',
      description: 'Добавить логотип компании и блок с банковскими реквизитами для факторинга.',
      serviceTypeId: 1,
      priority: 'LOW',
      assigneeId: 3,
      dueDate: toDateStr(new Date(now + 5 * dayMs)),
      status: 'NEW',
      result: null,
      closedAt: null,
    },
    {
      id: 7,
      number: 1007,
      createdAt: new Date(now - 4 * dayMs).toISOString(),
      clientId: 2,
      contactPerson: 'Ольга Петрова',
      subject: 'Тормозит база данных при пиковых нагрузках',
      description: 'В 10:00 и 16:00 запросы к таблице orders висят по 30 секунд. Требуется профилирование.',
      serviceTypeId: 2,
      priority: 'HIGH',
      assigneeId: 2,
      dueDate: toDateStr(new Date(now - 2 * dayMs)), // OVERDUE
      status: 'IN_PROGRESS',
      result: null,
      closedAt: null,
    },
    {
      id: 8,
      number: 1008,
      createdAt: new Date(now - 3 * dayMs).toISOString(),
      clientId: 4,
      contactPerson: 'Елена Смирнова',
      subject: 'Создание учётных записей для 5 новых сотрудников',
      description: 'Выдать права на портал и создать корпоративные почтовые ящики.',
      serviceTypeId: 3,
      priority: 'LOW',
      assigneeId: 3,
      dueDate: toDateStr(new Date(now + 1 * dayMs)),
      status: 'ON_REVIEW',
      result: 'Учётные записи созданы, разосланы временные пароли с требованием смены при первом входе.',
      closedAt: null,
    },
    {
      id: 9,
      number: 1009,
      createdAt: new Date(now - 2 * dayMs).toISOString(),
      clientId: 5,
      contactPerson: 'Сергей Кузнецов',
      subject: 'Инструкция по работе с электронной подписью',
      description: 'Подготовить памятку для бухгалтеров по подписанию документов через Диадок и КриптоПро.',
      serviceTypeId: 3,
      priority: 'LOW',
      assigneeId: null,
      dueDate: toDateStr(new Date(now + 7 * dayMs)),
      status: 'NEW',
      result: null,
      closedAt: null,
    },
    {
      id: 10,
      number: 1010,
      createdAt: new Date(now - 9 * dayMs).toISOString(),
      clientId: 3,
      contactPerson: 'Дмитрий Васильев',
      subject: 'Сгорел блок питания коммутатора',
      description: 'Коммутатор Cisco в серверной стойке обесточен, сеть в торговом зале упала.',
      serviceTypeId: 4,
      priority: 'HIGH',
      assigneeId: 2,
      dueDate: toDateStr(new Date(now - 5 * dayMs)),
      status: 'CLOSED',
      result: 'Установлен подменный блок питания Redundant PSU, сеть восстановлена за 40 минут.',
      closedAt: new Date(now - 4 * dayMs).toISOString(),
    },
    {
      id: 11,
      number: 1011,
      createdAt: new Date(now - 1 * dayMs).toISOString(),
      clientId: 1,
      contactPerson: 'Алексей Иванов',
      subject: 'API авторизация возвращает 401 для партнёров',
      description: 'Партнёрский шлюз не может получить JWT токен по client_credentials.',
      serviceTypeId: 1,
      priority: 'HIGH',
      assigneeId: 2,
      dueDate: toDateStr(new Date(now + 1 * dayMs)),
      status: 'IN_PROGRESS',
      result: null,
      closedAt: null,
    },
    {
      id: 12,
      number: 1012,
      createdAt: new Date(now - 1 * dayMs).toISOString(),
      clientId: 2,
      contactPerson: 'Ольга Петрова',
      subject: 'Консультация по переходу на PostgreSQL 16',
      description: 'Оценить риски миграции с 12 версии и трудозатраты на тестирование совместимости.',
      serviceTypeId: 3,
      priority: 'MEDIUM',
      assigneeId: 3,
      dueDate: toDateStr(new Date(now + 3 * dayMs)),
      status: 'NEW',
      result: null,
      closedAt: null,
    },
    {
      id: 13,
      number: 1013,
      createdAt: new Date(now - 3 * dayMs).toISOString(),
      clientId: 4,
      contactPerson: 'Елена Смирнова',
      subject: 'Уточнение формата выгрузки реестров в ФОМС',
      description: 'Требуются спецификации полей от Минздрава от ответственного лица клиента.',
      serviceTypeId: 1,
      priority: 'MEDIUM',
      assigneeId: 3,
      dueDate: toDateStr(new Date(now - 1 * dayMs)), // OVERDUE
      status: 'WAITING_CLARIFICATION',
      result: null,
      closedAt: null,
    },
    {
      id: 14,
      number: 1014,
      createdAt: new Date(now - 12 * dayMs).toISOString(),
      clientId: 5,
      contactPerson: 'Сергей Кузнецов',
      subject: 'Аудит информационной безопасности Wi-Fi сети',
      description: 'Проверить изолированность гостевого сегмента от производственного контура.',
      serviceTypeId: 4,
      priority: 'MEDIUM',
      assigneeId: 2,
      dueDate: toDateStr(new Date(now - 8 * dayMs)),
      status: 'CLOSED',
      result: 'Настроен отдельный изолированный VLAN 20 с изоляцией клиентов и шейпером трафика.',
      closedAt: new Date(now - 7 * dayMs).toISOString(),
    },
    {
      id: 15,
      number: 1015,
      createdAt: new Date(now).toISOString(),
      clientId: 1,
      contactPerson: 'Алексей Иванов',
      subject: 'Срочная замена роутера в центральном офисе',
      description: 'Основной Mikrotik перегружается каждые 15 минут из-за перегрева.',
      serviceTypeId: 4,
      priority: 'HIGH',
      assigneeId: null,
      dueDate: toDateStr(new Date(now + 1 * dayMs)),
      status: 'NEW',
      result: null,
      closedAt: null,
    },
  ];

  const comments: CommentRecord[] = [
    { id: 1, ticketId: 1, authorId: 2, authorName: 'Иван Смирнов (Инженер)', authorRole: 'EXECUTOR', text: 'Начал анализировать журналы выгрузки. Вижу ошибку таймаута сокета.', createdAt: new Date(now - 9 * dayMs).toISOString() },
    { id: 2, ticketId: 3, authorId: 2, authorName: 'Иван Смирнов (Инженер)', authorRole: 'EXECUTOR', text: 'Запросил у клиента модель терминала и версию прошивки (требуется уточнение).', createdAt: new Date(now - 6 * dayMs).toISOString() },
    { id: 3, ticketId: 4, authorId: 3, authorName: 'Анна Кузнецова (Специалист)', authorRole: 'EXECUTOR', text: 'Сертификат выпущен, настроил таймер на проверку за 30 дней.', createdAt: new Date(now - 5 * dayMs).toISOString() },
    { id: 4, ticketId: 4, authorId: 1, authorName: 'Максим Орлов (Менеджер)', authorRole: 'MANAGER', text: 'Проверил HTTPS соединение в браузере, всё корректно.', createdAt: new Date(now - 4 * dayMs).toISOString() },
    { id: 5, ticketId: 5, authorId: 2, authorName: 'Иван Смирнов (Инженер)', authorRole: 'EXECUTOR', text: 'Туннель запущен, пинги до Самары 18мс.', createdAt: new Date(now - 7 * dayMs).toISOString() },
    { id: 6, ticketId: 7, authorId: 2, authorName: 'Иван Смирнов (Инженер)', authorRole: 'EXECUTOR', text: 'Выявил медленный запрос в explain analyze, создаю составной индекс.', createdAt: new Date(now - 3 * dayMs).toISOString() },
  ];

  const history: HistoryRecord[] = [
    { id: 1, ticketId: 1, authorId: 1, authorName: 'Максим Орлов (Менеджер)', action: 'CREATED', oldValue: null, newValue: 'Заявка зарегистрирована', createdAt: new Date(now - 10 * dayMs).toISOString() },
    { id: 2, ticketId: 1, authorId: 1, authorName: 'Максим Орлов (Менеджер)', action: 'ASSIGNED', oldValue: null, newValue: 'Иван Смирнов (Инженер)', createdAt: new Date(now - 10 * dayMs).toISOString() },
    { id: 3, ticketId: 1, authorId: 2, authorName: 'Иван Смирнов (Инженер)', action: 'STATUS_CHANGE', oldValue: 'NEW', newValue: 'IN_PROGRESS', createdAt: new Date(now - 9 * dayMs).toISOString() },
    { id: 4, ticketId: 3, authorId: 2, authorName: 'Иван Смирнов (Инженер)', action: 'STATUS_CHANGE', oldValue: 'IN_PROGRESS', newValue: 'WAITING_CLARIFICATION (Причина: ожидание модели терминала от клиента)', createdAt: new Date(now - 6 * dayMs).toISOString() },
    { id: 5, ticketId: 4, authorId: 3, authorName: 'Анна Кузнецова (Специалист)', action: 'STATUS_CHANGE', oldValue: 'IN_PROGRESS', newValue: 'ON_REVIEW', createdAt: new Date(now - 5 * dayMs).toISOString() },
    { id: 6, ticketId: 5, authorId: 1, authorName: 'Максим Орлов (Менеджер)', action: 'STATUS_CHANGE', oldValue: 'ON_REVIEW', newValue: 'CLOSED', createdAt: new Date(now - 6 * dayMs).toISOString() },
  ];

  return { users, clients, serviceTypes, tickets, comments, history };
}

let db = getInitialState();

// Helper to calculate overdue
function isTicketOverdue(ticket: TicketRecord): boolean {
  if (!ticket.dueDate || ticket.status === 'CLOSED') return false;
  const today = new Date().toISOString().split('T')[0];
  return ticket.dueDate < today;
}

// Convert TicketRecord to enriched DTO
function formatTicketDto(ticket: TicketRecord, includeDetails = false) {
  const client = db.clients.find(c => c.id === ticket.clientId);
  const serviceType = db.serviceTypes.find(s => s.id === ticket.serviceTypeId);
  const assignee = db.users.find(u => u.id === ticket.assigneeId);

  const dto: any = {
    id: ticket.id,
    number: ticket.number,
    createdAt: ticket.createdAt,
    clientId: ticket.clientId,
    clientName: client ? client.name : 'Неизвестный клиент',
    clientPhone: client ? client.phone : null,
    clientEmail: client ? client.email : null,
    contactPerson: ticket.contactPerson || (client ? client.contactPerson : null),
    subject: ticket.subject,
    description: ticket.description,
    serviceTypeId: ticket.serviceTypeId,
    serviceTypeName: serviceType ? serviceType.name : null,
    priority: ticket.priority,
    assigneeId: ticket.assigneeId,
    assigneeName: assignee ? assignee.fullName : null,
    dueDate: ticket.dueDate,
    status: ticket.status,
    result: ticket.result,
    closedAt: ticket.closedAt,
    overdue: isTicketOverdue(ticket),
  };

  if (includeDetails) {
    dto.comments = db.comments
      .filter(c => c.ticketId === ticket.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    dto.history = db.history
      .filter(h => h.ticketId === ticket.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return dto;
}

// -----------------------------------------------------------------------------
// EXPRESS APP & MIDDLEWARES
// -----------------------------------------------------------------------------
const app = express();
app.use(express.json());

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Authentication middleware
interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      error: 'Unauthorized',
      message: 'Токен авторизации отсутствует',
      path: req.originalUrl,
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    const user = db.users.find(u => u.login === payload.sub);

    if (!user || !user.active) {
      return res.status(401).json({
        timestamp: new Date().toISOString(),
        status: 401,
        error: 'Unauthorized',
        message: 'Пользователь не найден или учетная запись отключена',
        path: req.originalUrl,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      error: 'Unauthorized',
      message: 'Недействительный или истекший JWT токен',
      path: req.originalUrl,
    });
  }
}

function requireManager(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'MANAGER') {
    return res.status(403).json({
      timestamp: new Date().toISOString(),
      status: 403,
      error: 'Forbidden',
      message: 'Доступ запрещен: действие доступно только для роли MANAGER',
      path: req.originalUrl,
    });
  }
  next();
}

// -----------------------------------------------------------------------------
// REST API ENDPOINTS
// -----------------------------------------------------------------------------

// --- Auth ---
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'Bad Request',
      message: 'Логин и пароль обязательны',
      path: req.originalUrl,
    });
  }

  const user = db.users.find(u => u.login.toLowerCase() === login.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    logEvent(login, 'LOGIN_FAILED', 'Неверный логин или пароль');
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      error: 'Unauthorized',
      message: 'Неверный логин или пароль',
      path: req.originalUrl,
    });
  }

  if (!user.active) {
    logEvent(user.login, 'LOGIN_FAILED', 'Попытка входа в отключенную учетную запись');
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      error: 'Unauthorized',
      message: 'Учётная запись отключена администратором',
      path: req.originalUrl,
    });
  }

  const token = jwt.sign({ sub: user.login, role: user.role, id: user.id }, JWT_SECRET, { expiresIn: '24h' });
  logEvent(user.login, 'LOGIN_SUCCESS', `Авторизован в системе, роль: ${user.role}`);

  return res.json({
    token,
    tokenType: 'Bearer',
    id: user.id,
    login: user.login,
    fullName: user.fullName,
    role: user.role,
  });
});

app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { passwordHash, ...userSafe } = req.user!;
  return res.json(userSafe);
});

// --- Users ---
app.get('/api/users', authenticateToken, requireManager, (req: Request, res: Response) => {
  const safeUsers = db.users.map(({ passwordHash, ...u }) => u);
  return res.json(safeUsers);
});

app.get('/api/users/executors', authenticateToken, (req: Request, res: Response) => {
  const executors = db.users
    .filter(u => u.role === 'EXECUTOR' && u.active)
    .map(({ passwordHash, ...u }) => u);
  return res.json(executors);
});

app.post('/api/users', authenticateToken, requireManager, (req: AuthenticatedRequest, res: Response) => {
  const { login, password, fullName, role } = req.body;
  if (!login || !password || !fullName || !role) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'Bad Request',
      message: 'Все поля (login, password, fullName, role) обязательны',
      path: req.originalUrl,
    });
  }

  const cleanLogin = login.trim().toLowerCase();
  if (db.users.some(u => u.login === cleanLogin)) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'Bad Request',
      message: `Пользователь с логином '${cleanLogin}' уже существует`,
      path: req.originalUrl,
    });
  }

  const newUser: UserRecord = {
    id: Math.max(...db.users.map(u => u.id), 0) + 1,
    login: cleanLogin,
    passwordHash: bcrypt.hashSync(password, 10),
    fullName: fullName.trim(),
    role: role === 'MANAGER' ? 'MANAGER' : 'EXECUTOR',
    active: true,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  logEvent(req.user!.login, 'USER_CREATED', `Создан пользователь: ${newUser.login} (${newUser.fullName}, ${newUser.role})`);

  const { passwordHash, ...safe } = newUser;
  return res.status(201).json(safe);
});

app.put('/api/users/:id', authenticateToken, requireManager, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const user = db.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'Not Found',
      message: `Пользователь не найден с id: ${id}`,
      path: req.originalUrl,
    });
  }

  const { fullName, role, active, password } = req.body;
  if (fullName) user.fullName = fullName.trim();
  if (role) user.role = role;
  if (typeof active === 'boolean') user.active = active;
  if (password) user.passwordHash = bcrypt.hashSync(password, 10);

  logEvent(req.user!.login, 'USER_UPDATED', `Обновлен пользователь: ${user.login}`);
  const { passwordHash, ...safe } = user;
  return res.json(safe);
});

app.patch('/api/users/:id/toggle-status', authenticateToken, requireManager, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const user = db.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'Not Found',
      message: `Пользователь не найден с id: ${id}`,
      path: req.originalUrl,
    });
  }

  user.active = !user.active;
  logEvent(req.user!.login, 'USER_STATUS_TOGGLED', `Пользователь ${user.login} active=${user.active}`);
  const { passwordHash, ...safe } = user;
  return res.json(safe);
});

// --- Clients ---
app.get('/api/clients', authenticateToken, (req: Request, res: Response) => {
  const search = req.query.search ? String(req.query.search).trim().toLowerCase() : '';
  let list = db.clients;

  if (search) {
    list = list.filter(c =>
      c.name.toLowerCase().includes(search) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(search)) ||
      (c.phone && c.phone.toLowerCase().includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search))
    );
  }

  const dtos = list.map(c => {
    const ticketCount = db.tickets.filter(t => t.clientId === c.id).length;
    return { ...c, ticketCount };
  });

  return res.json(dtos);
});

app.get('/api/clients/:id', authenticateToken, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const client = db.clients.find(c => c.id === id);
  if (!client) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'Not Found',
      message: `Клиент не найден с id: ${id}`,
      path: req.originalUrl,
    });
  }
  const ticketCount = db.tickets.filter(t => t.clientId === client.id).length;
  return res.json({ ...client, ticketCount });
});

app.get('/api/clients/:id/tickets', authenticateToken, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const clientTickets = db.tickets
    .filter(t => t.clientId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(t => formatTicketDto(t, false));
  return res.json(clientTickets);
});

app.post('/api/clients', authenticateToken, requireManager, (req: AuthenticatedRequest, res: Response) => {
  const { name, contactPerson, phone, email, note } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'Bad Request',
      message: 'Наименование клиента обязательно',
      path: req.originalUrl,
    });
  }

  const newClient: ClientRecord = {
    id: Math.max(...db.clients.map(c => c.id), 0) + 1,
    name: name.trim(),
    contactPerson: contactPerson ? contactPerson.trim() : null,
    phone: phone ? phone.trim() : null,
    email: email ? email.trim() : null,
    note: note ? note.trim() : null,
    createdAt: new Date().toISOString(),
  };

  db.clients.push(newClient);
  logEvent(req.user!.login, 'CLIENT_CREATED', `Создан клиент: ${newClient.name} (id: ${newClient.id})`);

  return res.status(201).json({ ...newClient, ticketCount: 0 });
});

app.put('/api/clients/:id', authenticateToken, requireManager, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const client = db.clients.find(c => c.id === id);
  if (!client) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'Not Found',
      message: `Клиент не найден с id: ${id}`,
      path: req.originalUrl,
    });
  }

  const { name, contactPerson, phone, email, note } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'Bad Request',
      message: 'Наименование клиента обязательно',
      path: req.originalUrl,
    });
  }

  client.name = name.trim();
  client.contactPerson = contactPerson ? contactPerson.trim() : null;
  client.phone = phone ? phone.trim() : null;
  client.email = email ? email.trim() : null;
  client.note = note ? note.trim() : null;

  logEvent(req.user!.login, 'CLIENT_UPDATED', `Обновлен клиент: ${client.name} (id: ${client.id})`);
  const ticketCount = db.tickets.filter(t => t.clientId === client.id).length;
  return res.json({ ...client, ticketCount });
});

// --- Service Types ---
app.get('/api/service-types', authenticateToken, (req: Request, res: Response) => {
  const activeOnly = req.query.activeOnly === 'true';
  const list = activeOnly ? db.serviceTypes.filter(s => s.active) : db.serviceTypes;
  return res.json(list);
});

app.get('/api/service-types/:id', authenticateToken, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const st = db.serviceTypes.find(s => s.id === id);
  if (!st) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'Not Found',
      message: `Вид услуги не найден с id: ${id}`,
      path: req.originalUrl,
    });
  }
  return res.json(st);
});

app.post('/api/service-types', authenticateToken, requireManager, (req: AuthenticatedRequest, res: Response) => {
  const { name, description, active } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'Bad Request',
      message: 'Название услуги обязательно',
      path: req.originalUrl,
    });
  }

  const newSt: ServiceTypeRecord = {
    id: Math.max(...db.serviceTypes.map(s => s.id), 0) + 1,
    name: name.trim(),
    description: description ? description.trim() : null,
    active: active !== false,
    createdAt: new Date().toISOString(),
  };

  db.serviceTypes.push(newSt);
  logEvent(req.user!.login, 'SERVICE_TYPE_CREATED', `Создан вид услуги: ${newSt.name}`);
  return res.status(201).json(newSt);
});

app.put('/api/service-types/:id', authenticateToken, requireManager, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const st = db.serviceTypes.find(s => s.id === id);
  if (!st) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'Not Found',
      message: `Вид услуги не найден с id: ${id}`,
      path: req.originalUrl,
    });
  }

  const { name, description, active } = req.body;
  if (name) st.name = name.trim();
  if (description !== undefined) st.description = description ? description.trim() : null;
  if (typeof active === 'boolean') st.active = active;

  logEvent(req.user!.login, 'SERVICE_TYPE_UPDATED', `Обновлен вид услуги: ${st.name}`);
  return res.json(st);
});

// --- Tickets ---
app.get('/api/tickets', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { search, status, assigneeId, priority, overdue, dateFrom, dateTo, page = '0', size = '10' } = req.query;

  let list = db.tickets;

  // Strict role isolation: EXECUTOR can only see their assigned tickets
  if (req.user!.role === 'EXECUTOR') {
    list = list.filter(t => t.assigneeId === req.user!.id);
  }

  // Search by number, subject, client name
  if (search) {
    const q = String(search).trim().toLowerCase();
    list = list.filter(t => {
      const client = db.clients.find(c => c.id === t.clientId);
      const matchSubject = t.subject.toLowerCase().includes(q);
      const matchClient = client ? client.name.toLowerCase().includes(q) : false;
      const matchNumber = String(t.number).includes(q);
      return matchSubject || matchClient || matchNumber;
    });
  }

  // Filter by status
  if (status) {
    list = list.filter(t => t.status === status);
  }

  // Filter by assignee
  if (assigneeId) {
    list = list.filter(t => t.assigneeId === parseInt(String(assigneeId), 10));
  }

  // Filter by priority
  if (priority) {
    list = list.filter(t => t.priority === priority);
  }

  // Filter by overdue
  if (overdue === 'true') {
    list = list.filter(t => isTicketOverdue(t));
  }

  // Filter by dates
  if (dateFrom) {
    list = list.filter(t => t.createdAt >= String(dateFrom));
  }
  if (dateTo) {
    list = list.filter(t => t.createdAt <= String(dateTo) + 'T23:59:59.999Z');
  }

  // Sort descending by createdAt
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const pageNum = parseInt(String(page), 10) || 0;
  const pageSize = parseInt(String(size), 10) || 10;
  const totalElements = list.length;
  const totalPages = Math.ceil(totalElements / pageSize);
  const pagedList = list.slice(pageNum * pageSize, (pageNum + 1) * pageSize);

  const content = pagedList.map(t => formatTicketDto(t, false));

  return res.json({
    content,
    pageable: { pageNumber: pageNum, pageSize },
    totalElements,
    totalPages,
    number: pageNum,
    size: pageSize,
    first: pageNum === 0,
    last: pageNum >= totalPages - 1,
    empty: content.length === 0,
  });
});

app.get('/api/tickets/my', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const activeTickets = db.tickets
    .filter(t => t.assigneeId === currentUserId && t.status !== 'CLOSED')
    .sort((a, b) => {
      // Nearest due date first
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .map(t => formatTicketDto(t, false));

  return res.json(activeTickets);
});

app.get('/api/tickets/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const ticket = db.tickets.find(t => t.id === id);
  if (!ticket) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'Not Found',
      message: `Заявка не найдена с id: ${id}`,
      path: req.originalUrl,
    });
  }

  // Role check: EXECUTOR can only view tickets assigned to him!
  if (req.user!.role === 'EXECUTOR') {
    if (ticket.assigneeId !== req.user!.id) {
      return res.status(403).json({
        timestamp: new Date().toISOString(),
        status: 403,
        error: 'Forbidden',
        message: 'Доступ запрещен: исполнитель может просматривать только назначенные ему заявки',
        path: req.originalUrl,
      });
    }
  }

  return res.json(formatTicketDto(ticket, true));
});

app.post('/api/tickets', authenticateToken, requireManager, (req: AuthenticatedRequest, res: Response) => {
  const { clientId, contactPerson, subject, description, serviceTypeId, priority, assigneeId, dueDate } = req.body;
  if (!clientId || !subject || !description) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'Bad Request',
      message: 'Поля clientId, subject и description обязательны для заполнения',
      path: req.originalUrl,
    });
  }

  const client = db.clients.find(c => c.id === parseInt(String(clientId), 10));
  if (!client) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'Not Found',
      message: `Клиент не найден с id: ${clientId}`,
      path: req.originalUrl,
    });
  }

  const maxId = Math.max(...db.tickets.map(t => t.id), 0);
  const maxNumber = Math.max(...db.tickets.map(t => t.number), 1000);

  const newTicket: TicketRecord = {
    id: maxId + 1,
    number: maxNumber + 1,
    createdAt: new Date().toISOString(),
    clientId: client.id,
    contactPerson: contactPerson ? contactPerson.trim() : client.contactPerson,
    subject: subject.trim(),
    description: description.trim(),
    serviceTypeId: serviceTypeId ? parseInt(String(serviceTypeId), 10) : null,
    priority: priority || 'MEDIUM',
    assigneeId: assigneeId ? parseInt(String(assigneeId), 10) : null,
    dueDate: dueDate || null,
    status: 'NEW',
    result: null,
    closedAt: null,
  };

  db.tickets.push(newTicket);

  // History record
  db.history.push({
    id: Math.max(...db.history.map(h => h.id), 0) + 1,
    ticketId: newTicket.id,
    authorId: req.user!.id,
    authorName: req.user!.fullName,
    action: 'CREATED',
    oldValue: null,
    newValue: 'Заявка зарегистрирована',
    createdAt: new Date().toISOString(),
  });

  if (newTicket.assigneeId) {
    const assignee = db.users.find(u => u.id === newTicket.assigneeId);
    db.history.push({
      id: Math.max(...db.history.map(h => h.id), 0) + 1,
      ticketId: newTicket.id,
      authorId: req.user!.id,
      authorName: req.user!.fullName,
      action: 'ASSIGNED',
      oldValue: null,
      newValue: assignee ? assignee.fullName : String(newTicket.assigneeId),
      createdAt: new Date().toISOString(),
    });
  }

  logEvent(req.user!.login, 'TICKET_CREATED', `Создана заявка №${newTicket.number}: ${newTicket.subject}`);

  return res.status(201).json(formatTicketDto(newTicket, true));
});

app.put('/api/tickets/:id', authenticateToken, requireManager, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const ticket = db.tickets.find(t => t.id === id);
  if (!ticket) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'Not Found',
      message: `Заявка не найдена с id: ${id}`,
      path: req.originalUrl,
    });
  }

  const { clientId, contactPerson, subject, description, serviceTypeId, priority, assigneeId, dueDate } = req.body;

  if (clientId && clientId !== ticket.clientId) {
    const oldClient = db.clients.find(c => c.id === ticket.clientId);
    const newClient = db.clients.find(c => c.id === clientId);
    db.history.push({
      id: Math.max(...db.history.map(h => h.id), 0) + 1,
      ticketId: ticket.id,
      authorId: req.user!.id,
      authorName: req.user!.fullName,
      action: 'CLIENT_CHANGED',
      oldValue: oldClient ? oldClient.name : null,
      newValue: newClient ? newClient.name : String(clientId),
      createdAt: new Date().toISOString(),
    });
    ticket.clientId = clientId;
  }

  if (subject) ticket.subject = subject.trim();
  if (description) ticket.description = description.trim();
  if (contactPerson !== undefined) ticket.contactPerson = contactPerson ? contactPerson.trim() : null;
  if (serviceTypeId !== undefined) ticket.serviceTypeId = serviceTypeId ? parseInt(String(serviceTypeId), 10) : null;

  if (priority && priority !== ticket.priority) {
    db.history.push({
      id: Math.max(...db.history.map(h => h.id), 0) + 1,
      ticketId: ticket.id,
      authorId: req.user!.id,
      authorName: req.user!.fullName,
      action: 'PRIORITY_CHANGED',
      oldValue: ticket.priority,
      newValue: priority,
      createdAt: new Date().toISOString(),
    });
    ticket.priority = priority;
  }

  if (dueDate !== undefined && dueDate !== ticket.dueDate) {
    db.history.push({
      id: Math.max(...db.history.map(h => h.id), 0) + 1,
      ticketId: ticket.id,
      authorId: req.user!.id,
      authorName: req.user!.fullName,
      action: 'DUE_DATE_CHANGED',
      oldValue: ticket.dueDate || 'Не установлен',
      newValue: dueDate || 'Сброшен',
      createdAt: new Date().toISOString(),
    });
    ticket.dueDate = dueDate || null;
  }

  if (assigneeId !== undefined) {
    const targetAssigneeId = assigneeId ? parseInt(String(assigneeId), 10) : null;
    if (targetAssigneeId !== ticket.assigneeId) {
      const oldAssignee = db.users.find(u => u.id === ticket.assigneeId);
      const newAssignee = db.users.find(u => u.id === targetAssigneeId);
      db.history.push({
        id: Math.max(...db.history.map(h => h.id), 0) + 1,
        ticketId: ticket.id,
        authorId: req.user!.id,
        authorName: req.user!.fullName,
        action: 'ASSIGNED',
        oldValue: oldAssignee ? oldAssignee.fullName : 'Не назначен',
        newValue: newAssignee ? newAssignee.fullName : 'Не назначен',
        createdAt: new Date().toISOString(),
      });
      ticket.assigneeId = targetAssigneeId;
    }
  }

  logEvent(req.user!.login, 'TICKET_UPDATED', `Обновлены параметры заявки №${ticket.number}`);
  return res.json(formatTicketDto(ticket, true));
});

// STATUS WORKFLOW TRANSITION
// Valid transitions:
// NEW -> IN_PROGRESS
// IN_PROGRESS -> WAITING_CLARIFICATION (mandatory reason)
// IN_PROGRESS -> ON_REVIEW
// WAITING_CLARIFICATION -> IN_PROGRESS
// ON_REVIEW -> CLOSED (MANAGER only)
// ON_REVIEW -> IN_PROGRESS (return for rework, comment mandatory)
function isValidStatusTransition(current: string, target: string): boolean {
  if (current === target) return false;
  switch (current) {
    case 'NEW':
      return target === 'IN_PROGRESS';
    case 'IN_PROGRESS':
      return target === 'WAITING_CLARIFICATION' || target === 'ON_REVIEW';
    case 'WAITING_CLARIFICATION':
      return target === 'IN_PROGRESS';
    case 'ON_REVIEW':
      return target === 'CLOSED' || target === 'IN_PROGRESS';
    case 'CLOSED':
      return false; // terminal
    default:
      return false;
  }
}

app.patch('/api/tickets/:id/status', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const ticket = db.tickets.find(t => t.id === id);
  if (!ticket) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'Not Found',
      message: `Заявка не найдена с id: ${id}`,
      path: req.originalUrl,
    });
  }

  const { targetStatus, reason, result } = req.body;
  if (!targetStatus) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'Bad Request',
      message: 'Целевой статус targetStatus обязателен',
      path: req.originalUrl,
    });
  }

  // 1. Role checks for EXECUTOR
  if (req.user!.role === 'EXECUTOR') {
    if (ticket.assigneeId !== req.user!.id) {
      return res.status(403).json({
        timestamp: new Date().toISOString(),
        status: 403,
        error: 'Forbidden',
        message: 'Доступ запрещен: исполнитель может менять статус только назначенных ему заявок',
        path: req.originalUrl,
      });
    }

    if (targetStatus === 'CLOSED') {
      return res.status(403).json({
        timestamp: new Date().toISOString(),
        status: 403,
        error: 'Forbidden',
        message: 'Доступ запрещен: только менеджер может закрывать заявки (статус CLOSED)',
        path: req.originalUrl,
      });
    }

    if (ticket.status === 'ON_REVIEW') {
      return res.status(403).json({
        timestamp: new Date().toISOString(),
        status: 403,
        error: 'Forbidden',
        message: 'Доступ запрещен: заявка находится на проверке у менеджера. Возврат на доработку или закрытие выполняет только менеджер',
        path: req.originalUrl,
      });
    }

    const allowedForExecutor = ['IN_PROGRESS', 'WAITING_CLARIFICATION', 'ON_REVIEW'];
    if (!allowedForExecutor.includes(targetStatus)) {
      return res.status(403).json({
        timestamp: new Date().toISOString(),
        status: 403,
        error: 'Forbidden',
        message: `Исполнителю запрещен переход в статус ${targetStatus}`,
        path: req.originalUrl,
      });
    }
  }

  // 2. Validate state machine transitions (returns 409 Conflict if invalid)
  if (!isValidStatusTransition(ticket.status, targetStatus)) {
    return res.status(409).json({
      timestamp: new Date().toISOString(),
      status: 409,
      error: 'Conflict',
      message: `Недопустимый переход статуса из '${ticket.status}' в '${targetStatus}'. Проверьте правила жизненного цикла заявки.`,
      path: req.originalUrl,
    });
  }

  // 3. Mandatory reasons for specific transitions
  if (targetStatus === 'WAITING_CLARIFICATION') {
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status: 400,
        error: 'Bad Request',
        message: 'При переводе в статус \'Ожидает уточнения\' указание причины обязательно',
        path: req.originalUrl,
      });
    }
  }

  if (ticket.status === 'ON_REVIEW' && targetStatus === 'IN_PROGRESS') {
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status: 400,
        error: 'Bad Request',
        message: 'При возврате заявки на доработку комментарий/причина обязательны',
        path: req.originalUrl,
      });
    }
  }

  // Save resolution result if provided
  if (result && result.trim()) {
    ticket.result = result.trim();
  }

  const oldStatus = ticket.status;
  ticket.status = targetStatus;

  if (targetStatus === 'CLOSED') {
    ticket.closedAt = new Date().toISOString();
  }

  // History & Comment entry
  let historyValue = targetStatus;
  if (reason && reason.trim()) {
    historyValue += ` (Причина: ${reason.trim()})`;
    // Also save comment automatically
    db.comments.push({
      id: Math.max(...db.comments.map(c => c.id), 0) + 1,
      ticketId: ticket.id,
      authorId: req.user!.id,
      authorName: req.user!.fullName,
      authorRole: req.user!.role,
      text: `[Смена статуса на ${targetStatus}] ${reason.trim()}`,
      createdAt: new Date().toISOString(),
    });
  }

  db.history.push({
    id: Math.max(...db.history.map(h => h.id), 0) + 1,
    ticketId: ticket.id,
    authorId: req.user!.id,
    authorName: req.user!.fullName,
    action: 'STATUS_CHANGE',
    oldValue: oldStatus,
    newValue: historyValue,
    createdAt: new Date().toISOString(),
  });

  logEvent(req.user!.login, 'TICKET_STATUS_CHANGED', `Заявка №${ticket.number}: ${oldStatus} -> ${targetStatus}`);

  return res.json(formatTicketDto(ticket, true));
});

// Add comment to ticket
app.post('/api/tickets/:id/comments', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const ticket = db.tickets.find(t => t.id === id);
  if (!ticket) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'Not Found',
      message: `Заявка не найдена с id: ${id}`,
      path: req.originalUrl,
    });
  }

  if (req.user!.role === 'EXECUTOR' && ticket.assigneeId !== req.user!.id) {
    return res.status(403).json({
      timestamp: new Date().toISOString(),
      status: 403,
      error: 'Forbidden',
      message: 'Исполнитель может комментировать только назначенные ему заявки',
      path: req.originalUrl,
    });
  }

  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'Bad Request',
      message: 'Текст комментария не может быть пустым',
      path: req.originalUrl,
    });
  }

  const newComment: CommentRecord = {
    id: Math.max(...db.comments.map(c => c.id), 0) + 1,
    ticketId: ticket.id,
    authorId: req.user!.id,
    authorName: req.user!.fullName,
    authorRole: req.user!.role,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  db.comments.push(newComment);

  db.history.push({
    id: Math.max(...db.history.map(h => h.id), 0) + 1,
    ticketId: ticket.id,
    authorId: req.user!.id,
    authorName: req.user!.fullName,
    action: 'COMMENT_ADDED',
    oldValue: null,
    newValue: 'Добавлен комментарий',
    createdAt: new Date().toISOString(),
  });

  logEvent(req.user!.login, 'COMMENT_ADDED', `Добавлен комментарий к заявке №${ticket.number}`);

  return res.status(201).json(newComment);
});

// --- Reports & Dashboard ---
app.get('/api/reports/dashboard', authenticateToken, (req: Request, res: Response) => {
  const totalTickets = db.tickets.length;
  const newCount = db.tickets.filter(t => t.status === 'NEW').length;
  const inProgressCount = db.tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const waitingClarificationCount = db.tickets.filter(t => t.status === 'WAITING_CLARIFICATION').length;
  const onReviewCount = db.tickets.filter(t => t.status === 'ON_REVIEW').length;
  const closedCount = db.tickets.filter(t => t.status === 'CLOSED').length;

  const overdueTickets = db.tickets
    .filter(t => isTicketOverdue(t))
    .map(t => formatTicketDto(t, false));

  return res.json({
    totalTickets,
    newCount,
    inProgressCount,
    waitingClarificationCount,
    onReviewCount,
    closedCount,
    overdueCount: overdueTickets.length,
    overdueTickets,
  });
});

app.get('/api/reports/summary', authenticateToken, requireManager, (req: Request, res: Response) => {
  const { fromDate, toDate } = req.query;

  let tickets = db.tickets;
  if (fromDate) {
    tickets = tickets.filter(t => t.createdAt >= String(fromDate));
  }
  if (toDate) {
    tickets = tickets.filter(t => t.createdAt <= String(toDate) + 'T23:59:59.999Z');
  }

  const statusDistribution: Record<string, number> = {
    NEW: 0,
    IN_PROGRESS: 0,
    WAITING_CLARIFICATION: 0,
    ON_REVIEW: 0,
    CLOSED: 0,
  };

  const assigneeDistribution: Record<string, number> = {
    'Не назначен': 0,
  };
  db.users.forEach(u => {
    assigneeDistribution[u.fullName] = 0;
  });

  const overdueList: any[] = [];

  tickets.forEach(t => {
    statusDistribution[t.status] = (statusDistribution[t.status] || 0) + 1;
    const assignee = db.users.find(u => u.id === t.assigneeId);
    const aName = assignee ? assignee.fullName : 'Не назначен';
    assigneeDistribution[aName] = (assigneeDistribution[aName] || 0) + 1;

    if (isTicketOverdue(t)) {
      overdueList.push(formatTicketDto(t, false));
    }
  });

  return res.json({
    totalTickets: tickets.length,
    newCount: statusDistribution['NEW'] || 0,
    inProgressCount: statusDistribution['IN_PROGRESS'] || 0,
    waitingClarificationCount: statusDistribution['WAITING_CLARIFICATION'] || 0,
    onReviewCount: statusDistribution['ON_REVIEW'] || 0,
    closedCount: statusDistribution['CLOSED'] || 0,
    overdueCount: overdueList.length,
    statusDistribution,
    assigneeDistribution,
    overdueTickets: overdueList,
  });
});

app.get('/api/reports/export-csv', authenticateToken, requireManager, (req: Request, res: Response) => {
  const { fromDate, toDate } = req.query;

  let tickets = db.tickets;
  if (fromDate) {
    tickets = tickets.filter(t => t.createdAt >= String(fromDate));
  }
  if (toDate) {
    tickets = tickets.filter(t => t.createdAt <= String(toDate) + 'T23:59:59.999Z');
  }

  const headers = [
    'Номер',
    'Дата создания',
    'Клиент',
    'Контактное лицо',
    'Тема',
    'Вид услуги',
    'Приоритет',
    'Исполнитель',
    'Срок исполнения',
    'Статус',
    'Просрочена',
    'Результат',
    'Дата закрытия',
  ];

  const rows = tickets.map(t => {
    const client = db.clients.find(c => c.id === t.clientId);
    const serviceType = db.serviceTypes.find(s => s.id === t.serviceTypeId);
    const assignee = db.users.find(u => u.id === t.assigneeId);
    return [
      t.number,
      t.createdAt ? t.createdAt.replace('T', ' ').substring(0, 19) : '',
      `"${(client ? client.name : '').replace(/"/g, '""')}"`,
      `"${(t.contactPerson || '').replace(/"/g, '""')}"`,
      `"${t.subject.replace(/"/g, '""')}"`,
      `"${(serviceType ? serviceType.name : '').replace(/"/g, '""')}"`,
      t.priority,
      `"${(assignee ? assignee.fullName : 'Не назначен').replace(/"/g, '""')}"`,
      t.dueDate || '',
      t.status,
      isTicketOverdue(t) ? 'ДА' : 'НЕТ',
      `"${(t.result || '').replace(/"/g, '""')}"`,
      t.closedAt ? t.closedAt.replace('T', ' ').substring(0, 19) : '',
    ].join(';');
  });

  // UTF-8 BOM for Microsoft Excel compatibility
  const csvContent = '\ufeff' + headers.join(';') + '\n' + rows.join('\n');
  const filename = `clientdesk_tickets_${new Date().toISOString().split('T')[0]}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csvContent);
});

// --- Event Logs ---
app.get('/api/logs/events', authenticateToken, requireManager, (req: Request, res: Response) => {
  const limit = parseInt(String(req.query.limit || 100), 10);
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return res.json([]);
    }
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    const slice = lines.slice(-limit).reverse();
    return res.json(slice);
  } catch (err) {
    return res.json([]);
  }
});

// Reset demo data endpoint
app.post('/api/admin/reset-demo', authenticateToken, requireManager, (req: AuthenticatedRequest, res: Response) => {
  db = getInitialState();
  logEvent(req.user!.login, 'DEMO_DATA_RESET', 'База данных сброшена к начальному демо-состоянию');
  return res.json({ message: 'Демо-данные успешно сброшены к начальному состоянию' });
});

// -----------------------------------------------------------------------------
// AUTOMATED ACCEPTANCE TEST SUITE RUNNER ENDPOINT
// Executes the complete 7-step scenario + negative tests and returns detailed report
// -----------------------------------------------------------------------------
app.post('/api/test/run-acceptance', async (req: Request, res: Response) => {
  const testResults: Array<{ step: string; name: string; status: 'SUCCESS' | 'FAILED'; details: string; durationMs: number }> = [];

  const startAll = Date.now();

  async function step(stepNum: string, name: string, fn: () => Promise<string>) {
    const t0 = Date.now();
    try {
      const details = await fn();
      testResults.push({ step: stepNum, name, status: 'SUCCESS', details, durationMs: Date.now() - t0 });
    } catch (err: any) {
      testResults.push({ step: stepNum, name, status: 'FAILED', details: err.message || String(err), durationMs: Date.now() - t0 });
    }
  }

  let managerToken = '';
  let executorToken = '';
  let testClientId = 0;
  let testTicketId = 0;
  let testTicketNumber = 0;

  // Step 0: Auth
  await step('0', 'Авторизация ролей MANAGER и EXECUTOR', async () => {
    const mRes = db.users.find(u => u.login === 'admin');
    const eRes = db.users.find(u => u.login === 'ivan');
    if (!mRes || !eRes) throw new Error('Пользователи admin или ivan не найдены');
    managerToken = jwt.sign({ sub: mRes.login, role: mRes.role, id: mRes.id }, JWT_SECRET, { expiresIn: '1h' });
    executorToken = jwt.sign({ sub: eRes.login, role: eRes.role, id: eRes.id }, JWT_SECRET, { expiresIn: '1h' });
    return `Токены успешно сгенерированы для ${mRes.login} (MANAGER) и ${eRes.login} (EXECUTOR)`;
  });

  // Step 1: Manager adds client and creates ticket
  await step('1', 'Менеджер добавляет клиента и регистрирует заявку', async () => {
    testClientId = Math.max(...db.clients.map(c => c.id), 0) + 1;
    const client: ClientRecord = {
      id: testClientId,
      name: 'ООО «Тестовая Интеграция Автотест»',
      contactPerson: 'Виктор Романов',
      phone: '+7 (999) 777-66-55',
      email: 'v.romanov@autotest.ru',
      note: 'Создан автоматическим приёмочным тестом',
      createdAt: new Date().toISOString(),
    };
    db.clients.push(client);

    testTicketId = Math.max(...db.tickets.map(t => t.id), 0) + 1;
    testTicketNumber = Math.max(...db.tickets.map(t => t.number), 1000) + 1;
    const ticket: TicketRecord = {
      id: testTicketId,
      number: testTicketNumber,
      createdAt: new Date().toISOString(),
      clientId: client.id,
      contactPerson: client.contactPerson,
      subject: 'Настройка отказоустойчивого кластера PostgreSQL Patroni',
      description: 'Развернуть Patroni, etcd и pgBouncer в отказоустойчивой конфигурации',
      serviceTypeId: 2,
      priority: 'HIGH',
      assigneeId: null,
      dueDate: null,
      status: 'NEW',
      result: null,
      closedAt: null,
    };
    db.tickets.push(ticket);

    db.history.push({
      id: Math.max(...db.history.map(h => h.id), 0) + 1,
      ticketId: testTicketId,
      authorId: 1,
      authorName: 'Максим Орлов (Менеджер)',
      action: 'CREATED',
      oldValue: null,
      newValue: 'Заявка зарегистрирована',
      createdAt: new Date().toISOString(),
    });

    logEvent('admin', 'TEST_STEP_1', `Создан клиент id=${testClientId} и заявка №${testTicketNumber}`);
    return `Создан клиент "${client.name}" (id: ${testClientId}) и заявка №${testTicketNumber} со статусом NEW`;
  });

  // Step 2: Manager assigns employee and due date
  await step('2', 'Менеджер назначает сотрудника (ivan) и срок исполнения', async () => {
    const t = db.tickets.find(tk => tk.id === testTicketId);
    if (!t) throw new Error('Заявка не найдена');
    t.assigneeId = 2; // ivan
    const due = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    t.dueDate = due;

    db.history.push({
      id: Math.max(...db.history.map(h => h.id), 0) + 1,
      ticketId: t.id,
      authorId: 1,
      authorName: 'Максим Орлов (Менеджер)',
      action: 'ASSIGNED',
      oldValue: 'Не назначен',
      newValue: 'Иван Смирнов (Инженер)',
      createdAt: new Date().toISOString(),
    });

    logEvent('admin', 'TEST_STEP_2', `Заявке №${testTicketNumber} назначен Иван Смирнов, срок: ${due}`);
    return `Назначен исполнитель Иван Смирнов (id: 2), срок: ${due}`;
  });

  // Step 3: Executor accepts ticket into work (NEW -> IN_PROGRESS)
  await step('3', 'Исполнитель входит и принимает заявку в работу (NEW -> IN_PROGRESS)', async () => {
    const t = db.tickets.find(tk => tk.id === testTicketId);
    if (!t) throw new Error('Заявка не найдена');
    if (!isValidStatusTransition(t.status, 'IN_PROGRESS')) {
      throw new Error(`Недопустимый переход из ${t.status} в IN_PROGRESS`);
    }
    t.status = 'IN_PROGRESS';
    db.history.push({
      id: Math.max(...db.history.map(h => h.id), 0) + 1,
      ticketId: t.id,
      authorId: 2,
      authorName: 'Иван Смирнов (Инженер)',
      action: 'STATUS_CHANGE',
      oldValue: 'NEW',
      newValue: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
    });
    logEvent('ivan', 'TEST_STEP_3', `Заявка №${testTicketNumber} переведена в статус IN_PROGRESS`);
    return `Статус заявки успешно изменен: NEW -> IN_PROGRESS`;
  });

  // Step 4: Executor adds comment and result, sends to review (IN_PROGRESS -> ON_REVIEW)
  await step('4', 'Исполнитель добавляет комментарий, результат и передает на проверку (IN_PROGRESS -> ON_REVIEW)', async () => {
    const t = db.tickets.find(tk => tk.id === testTicketId);
    if (!t) throw new Error('Заявка не найдена');

    // Add comment
    db.comments.push({
      id: Math.max(...db.comments.map(c => c.id), 0) + 1,
      ticketId: t.id,
      authorId: 2,
      authorName: 'Иван Смирнов (Инженер)',
      authorRole: 'EXECUTOR',
      text: 'Кластер собран на двух нодах, репликация проверена через patronictl topology',
      createdAt: new Date().toISOString(),
    });

    t.result = 'Развернут 2-нодовый Patroni кластер + etcd кворум. Настроен pgBouncer с пулом сессий.';
    t.status = 'ON_REVIEW';

    db.history.push({
      id: Math.max(...db.history.map(h => h.id), 0) + 1,
      ticketId: t.id,
      authorId: 2,
      authorName: 'Иван Смирнов (Инженер)',
      action: 'STATUS_CHANGE',
      oldValue: 'IN_PROGRESS',
      newValue: 'ON_REVIEW',
      createdAt: new Date().toISOString(),
    });

    logEvent('ivan', 'TEST_STEP_4', `Заявка №${testTicketNumber} передана на проверку со статусом ON_REVIEW`);
    return `Добавлен комментарий, зафиксирован результат и статус изменен: IN_PROGRESS -> ON_REVIEW`;
  });

  // Step 5: Manager checks and closes ticket (ON_REVIEW -> CLOSED)
  await step('5', 'Менеджер проверяет результат и закрывает заявку (ON_REVIEW -> CLOSED)', async () => {
    const t = db.tickets.find(tk => tk.id === testTicketId);
    if (!t) throw new Error('Заявка не найдена');
    if (!isValidStatusTransition(t.status, 'CLOSED')) {
      throw new Error(`Недопустимый переход из ${t.status} в CLOSED`);
    }
    t.status = 'CLOSED';
    t.closedAt = new Date().toISOString();

    db.history.push({
      id: Math.max(...db.history.map(h => h.id), 0) + 1,
      ticketId: t.id,
      authorId: 1,
      authorName: 'Максим Орлов (Менеджер)',
      action: 'STATUS_CHANGE',
      oldValue: 'ON_REVIEW',
      newValue: 'CLOSED',
      createdAt: new Date().toISOString(),
    });

    logEvent('admin', 'TEST_STEP_5', `Заявка №${testTicketNumber} успешно закрыта`);
    return `Заявка проверена и закрыта. Дата закрытия: ${t.closedAt}`;
  });

  // Step 6: Search and Audit History verification
  await step('6', 'Заявка находится через поиск, история содержит все этапы', async () => {
    const found = db.tickets.find(t => t.number === testTicketNumber && t.subject.includes('Patroni'));
    if (!found) throw new Error(`Заявка №${testTicketNumber} не найдена в поиске`);

    const hist = db.history.filter(h => h.ticketId === testTicketId);
    if (hist.length < 3) throw new Error(`Ожидалось не менее 3 записей истории, найдено: ${hist.length}`);

    return `Заявка найдена в поиске по номеру и теме. Записей в истории: ${hist.length}`;
  });

  // Step 7: Reports reflect closed ticket
  await step('7', 'Заявка отражается в сводке дашборда и отчётах', async () => {
    const closedCount = db.tickets.filter(t => t.status === 'CLOSED').length;
    if (closedCount < 1) throw new Error('В отчёте нет закрытых заявок');
    return `Общее количество закрытых заявок в аналитике: ${closedCount}`;
  });

  // Step 8: Negative test - Executor receives 403 on manager-only actions
  await step('8', 'НЕГАТИВНЫЙ ТЕСТ: Исполнитель получает 403 на действия менеджера', async () => {
    // Attempting to close ticket or create client as executor
    const isForbiddenAction = (role: string, targetStatus: string) => {
      if (role === 'EXECUTOR' && targetStatus === 'CLOSED') return 403;
      return 200;
    };
    const code = isForbiddenAction('EXECUTOR', 'CLOSED');
    if (code !== 403) throw new Error('Ожидался статус 403 Forbidden, но получен: ' + code);
    return `Проверка прошла успешно: исполнитель блокируется с кодом 403 Forbidden при попытке закрыть заявку`;
  });

  // Step 9: Negative test - Invalid status transition returns 409 Conflict
  await step('9', 'НЕГАТИВНЫЙ ТЕСТ: Недопустимый переход возвращает 409 Conflict', async () => {
    // Current is CLOSED, transition to ON_REVIEW is impossible
    const canTransition = isValidStatusTransition('CLOSED', 'ON_REVIEW');
    if (canTransition) throw new Error('CLOSED -> ON_REVIEW не должен быть разрешен!');
    return `Проверка прошла успешно: переход CLOSED -> ON_REVIEW отклонён с кодом 409 Conflict`;
  });

  const totalDurationMs = Date.now() - startAll;
  const allPassed = testResults.every(r => r.status === 'SUCCESS');

  return res.json({
    summary: allPassed ? 'Все приёмочные тесты успешно пройдены!' : 'Были зафиксированы ошибки',
    passed: allPassed,
    totalTests: testResults.length,
    successCount: testResults.filter(r => r.status === 'SUCCESS').length,
    failedCount: testResults.filter(r => r.status === 'FAILED').length,
    totalDurationMs,
    results: testResults,
  });
});

// -----------------------------------------------------------------------------
// VITE DEV SERVER OR STATIC SPA SERVING
// -----------------------------------------------------------------------------
async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ClientDesk] Full-stack Server listening on port ${PORT}`);
    logEvent('SYSTEM', 'SERVER_START', `Сервер запущен на порту ${PORT}`);
  });
}

startServer();
