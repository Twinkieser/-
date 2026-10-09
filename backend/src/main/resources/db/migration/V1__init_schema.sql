-- ========================================================
-- V1__init_schema.sql: ClientDesk Database Schema Definition
-- ========================================================

-- 1. Users Table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('MANAGER', 'EXECUTOR')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_login ON users(login);
CREATE INDEX idx_users_role ON users(role);

-- 2. Clients Table
CREATE TABLE clients (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(100),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_name ON clients(name);

-- 3. Service Types (Справочник видов услуг)
CREATE TABLE service_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tickets Table (Заявки клиентов)
CREATE SEQUENCE ticket_number_seq START WITH 1001 INCREMENT BY 1;

CREATE TABLE tickets (
    id BIGSERIAL PRIMARY KEY,
    number BIGINT NOT NULL UNIQUE DEFAULT nextval('ticket_number_seq'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    contact_person VARCHAR(150),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    service_type_id BIGINT REFERENCES service_types(id) ON DELETE SET NULL,
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    assignee_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'IN_PROGRESS', 'WAITING_CLARIFICATION', 'ON_REVIEW', 'CLOSED')),
    result TEXT,
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tickets_number ON tickets(number);
CREATE INDEX idx_tickets_client_id ON tickets(client_id);
CREATE INDEX idx_tickets_assignee_id ON tickets(assignee_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_due_date ON tickets(due_date);
CREATE INDEX idx_tickets_priority ON tickets(priority);

-- 5. Ticket Comments (Комментарии к заявкам)
CREATE TABLE ticket_comments (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_ticket_id ON ticket_comments(ticket_id);

-- 6. Ticket History (Аудит действий и переходов)
CREATE TABLE ticket_history (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_history_ticket_id ON ticket_history(ticket_id);
