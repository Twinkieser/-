export type Role = 'MANAGER' | 'EXECUTOR';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TicketStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'WAITING_CLARIFICATION'
  | 'ON_REVIEW'
  | 'CLOSED';

export interface User {
  id: number;
  login: string;
  fullName: string;
  role: Role;
  active: boolean;
  createdAt?: string;
}

export interface Client {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  createdAt: string;
  ticketCount?: number;
}

export interface ServiceType {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
}

export interface TicketComment {
  id: number;
  ticketId: number;
  authorId: number;
  authorName: string;
  authorRole: Role;
  text: string;
  createdAt: string;
}

export interface TicketHistory {
  id: number;
  ticketId: number;
  authorId: number;
  authorName: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface Ticket {
  id: number;
  number: number;
  createdAt: string;
  clientId: number;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  contactPerson: string | null;
  subject: string;
  description: string;
  serviceTypeId: number | null;
  serviceTypeName: string | null;
  priority: Priority;
  assigneeId: number | null;
  assigneeName: string | null;
  dueDate: string | null; // YYYY-MM-DD
  status: TicketStatus;
  result: string | null;
  closedAt: string | null;
  overdue: boolean;
  comments?: TicketComment[];
  history?: TicketHistory[];
}

export interface DashboardStats {
  totalTickets: number;
  newCount: number;
  inProgressCount: number;
  waitingClarificationCount: number;
  onReviewCount: number;
  closedCount: number;
  overdueCount: number;
  overdueTickets: Ticket[];
}

export interface ReportSummary extends DashboardStats {
  statusDistribution: Record<string, number>;
  assigneeDistribution: Record<string, number>;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface TestResultItem {
  step: string;
  name: string;
  status: 'SUCCESS' | 'FAILED';
  details: string;
  durationMs: number;
}

export interface TestSuiteResult {
  summary: string;
  passed: boolean;
  totalTests: number;
  successCount: number;
  failedCount: number;
  totalDurationMs: number;
  results: TestResultItem[];
}
