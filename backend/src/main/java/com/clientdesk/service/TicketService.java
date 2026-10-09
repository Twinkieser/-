package com.clientdesk.service;

import com.clientdesk.dto.*;
import com.clientdesk.exception.AccessDeniedCustomException;
import com.clientdesk.exception.BadRequestException;
import com.clientdesk.exception.InvalidStatusTransitionException;
import com.clientdesk.exception.ResourceNotFoundException;
import com.clientdesk.model.*;
import com.clientdesk.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class TicketService {

    private final TicketRepository ticketRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final ServiceTypeRepository serviceTypeRepository;
    private final TicketCommentRepository commentRepository;
    private final TicketHistoryRepository historyRepository;
    private final EventLogger eventLogger;

    public TicketService(TicketRepository ticketRepository,
                         ClientRepository clientRepository,
                         UserRepository userRepository,
                         ServiceTypeRepository serviceTypeRepository,
                         TicketCommentRepository commentRepository,
                         TicketHistoryRepository historyRepository,
                         EventLogger eventLogger) {
        this.ticketRepository = ticketRepository;
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
        this.serviceTypeRepository = serviceTypeRepository;
        this.commentRepository = commentRepository;
        this.historyRepository = historyRepository;
        this.eventLogger = eventLogger;
    }

    @Transactional(readOnly = true)
    public Page<TicketDto> getTickets(String search,
                                     TicketStatus status,
                                     Long assigneeId,
                                     Priority priority,
                                     Boolean overdue,
                                     LocalDate dateFrom,
                                     LocalDate dateTo,
                                     Pageable pageable,
                                     User currentUser) {

        Specification<Ticket> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();

            // Strict role isolation: EXECUTOR can only see their assigned tickets
            if (currentUser != null && currentUser.getRole() == Role.EXECUTOR) {
                predicates.add(cb.equal(root.get("assignee").get("id"), currentUser.getId()));
            } else if (assigneeId != null) {
                predicates.add(cb.equal(root.get("assignee").get("id"), assigneeId));
            }
                String pattern = "%" + search.trim().toLowerCase() + "%";
                var searchPredicates = new ArrayList<jakarta.persistence.criteria.Predicate>();

                // Match subject
                searchPredicates.add(cb.like(cb.lower(root.get("subject")), pattern));

                // Match client name
                searchPredicates.add(cb.like(cb.lower(root.get("client").get("name")), pattern));

                // Match ticket number if numeric
                try {
                    Long num = Long.parseLong(search.trim());
                    searchPredicates.add(cb.equal(root.get("number"), num));
                } catch (NumberFormatException ignored) {}

                predicates.add(cb.or(searchPredicates.toArray(new jakarta.persistence.criteria.Predicate[0])));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (assigneeId != null) {
                predicates.add(cb.equal(root.get("assignee").get("id"), assigneeId));
            }

            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }

            if (Boolean.TRUE.equals(overdue)) {
                predicates.add(cb.isNotNull(root.get("dueDate")));
                predicates.add(cb.lessThan(root.get("dueDate"), LocalDate.now()));
                predicates.add(cb.notEqual(root.get("status"), TicketStatus.CLOSED));
            }

            if (dateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dateFrom.atStartOfDay().atOffset(OffsetDateTime.now().getOffset())));
            }

            if (dateTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), dateTo.plusDays(1).atStartOfDay().atOffset(OffsetDateTime.now().getOffset())));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return ticketRepository.findAll(spec, pageable)
                .map(t -> TicketDto.fromEntity(t, false));
    }

    @Transactional(readOnly = true)
    public TicketDto getTicketById(Long id, User currentUser) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Заявка не найдена с id: " + id));

        // Executor can only view assigned tickets if role is EXECUTOR
        if (currentUser.getRole() == Role.EXECUTOR) {
            if (ticket.getAssignee() == null || !ticket.getAssignee().getId().equals(currentUser.getId())) {
                throw new AccessDeniedCustomException("Исполнитель может просматривать только назначенные ему заявки");
            }
        }

        return TicketDto.fromEntity(ticket, true);
    }

    @Transactional(readOnly = true)
    public List<TicketDto> getMyTasks(User currentUser) {
        if (currentUser.getRole() != Role.EXECUTOR) {
            return List.of();
        }
        return ticketRepository.findActiveTicketsForAssignee(currentUser.getId()).stream()
                .map(t -> TicketDto.fromEntity(t, false))
                .toList();
    }

    public TicketDto createTicket(CreateTicketRequest request, User currentUser) {
        if (currentUser.getRole() != Role.MANAGER) {
            throw new AccessDeniedCustomException("Только менеджер может регистрировать новые заявки");
        }

        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Клиент не найден с id: " + request.getClientId()));

        Ticket ticket = new Ticket();
        ticket.setClient(client);
        ticket.setContactPerson(request.getContactPerson() != null && !request.getContactPerson().isBlank()
                ? request.getContactPerson().trim() : client.getContactPerson());
        ticket.setSubject(request.getSubject().trim());
        ticket.setDescription(request.getDescription().trim());
        ticket.setPriority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM);
        ticket.setDueDate(request.getDueDate());
        ticket.setStatus(TicketStatus.NEW);

        if (request.getServiceTypeId() != null) {
            ServiceType st = serviceTypeRepository.findById(request.getServiceTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Вид услуги не найден"));
            ticket.setServiceType(st);
        }

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Исполнитель не найден"));
            ticket.setAssignee(assignee);
        }

        // Generate ticket number from max or sequence
        Long maxNumber = ticketRepository.findAll().stream()
                .map(Ticket::getNumber)
                .max(Long::compareTo)
                .orElse(1000L);
        ticket.setNumber(maxNumber + 1);

        Ticket saved = ticketRepository.save(ticket);

        // Record history
        TicketHistory hCreated = new TicketHistory(saved, currentUser, "CREATED", null, "Заявка зарегистрирована");
        historyRepository.save(hCreated);

        if (saved.getAssignee() != null) {
            TicketHistory hAssign = new TicketHistory(saved, currentUser, "ASSIGNED", null, saved.getAssignee().getFullName());
            historyRepository.save(hAssign);
        }

        eventLogger.logEvent(currentUser.getLogin(), "TICKET_CREATED",
                String.format("Создана заявка №%d: %s (клиент: %s, исполнитель: %s)",
                        saved.getNumber(), saved.getSubject(), saved.getClient().getName(),
                        saved.getAssignee() != null ? saved.getAssignee().getFullName() : "Не назначен"));

        return TicketDto.fromEntity(saved, true);
    }

    public TicketDto updateTicket(Long id, UpdateTicketRequest request, User currentUser) {
        if (currentUser.getRole() != Role.MANAGER) {
            throw new AccessDeniedCustomException("Только менеджер может изменять основные параметры заявки");
        }

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Заявка не найдена с id: " + id));

        if (request.getClientId() != null && !request.getClientId().equals(ticket.getClient().getId())) {
            Client newClient = clientRepository.findById(request.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Клиент не найден"));
            historyRepository.save(new TicketHistory(ticket, currentUser, "CLIENT_CHANGED",
                    ticket.getClient().getName(), newClient.getName()));
            ticket.setClient(newClient);
        }

        if (request.getSubject() != null && !request.getSubject().isBlank()) {
            ticket.setSubject(request.getSubject().trim());
        }

        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            ticket.setDescription(request.getDescription().trim());
        }

        if (request.getContactPerson() != null) {
            ticket.setContactPerson(request.getContactPerson().trim());
        }

        if (request.getServiceTypeId() != null) {
            ServiceType st = serviceTypeRepository.findById(request.getServiceTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Вид услуги не найден"));
            ticket.setServiceType(st);
        }

        if (request.getPriority() != null && request.getPriority() != ticket.getPriority()) {
            historyRepository.save(new TicketHistory(ticket, currentUser, "PRIORITY_CHANGED",
                    ticket.getPriority().name(), request.getPriority().name()));
            ticket.setPriority(request.getPriority());
        }

        if (request.getDueDate() != null && !request.getDueDate().equals(ticket.getDueDate())) {
            historyRepository.save(new TicketHistory(ticket, currentUser, "DUE_DATE_CHANGED",
                    ticket.getDueDate() != null ? ticket.getDueDate().toString() : "Не установлен",
                    request.getDueDate().toString()));
            ticket.setDueDate(request.getDueDate());
        }

        if (request.getAssigneeId() != null) {
            Long currentAssigneeId = ticket.getAssignee() != null ? ticket.getAssignee().getId() : null;
            if (!request.getAssigneeId().equals(currentAssigneeId)) {
                User newAssignee = userRepository.findById(request.getAssigneeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Исполнитель не найден"));
                historyRepository.save(new TicketHistory(ticket, currentUser, "ASSIGNED",
                        ticket.getAssignee() != null ? ticket.getAssignee().getFullName() : "Не назначен",
                        newAssignee.getFullName()));
                ticket.setAssignee(newAssignee);
            }
        }

        Ticket saved = ticketRepository.save(ticket);
        eventLogger.logEvent(currentUser.getLogin(), "TICKET_UPDATED",
                String.format("Обновлена заявка №%d", saved.getNumber()));

        return TicketDto.fromEntity(saved, true);
    }

    public TicketDto changeTicketStatus(Long id, StatusChangeRequest request, User currentUser) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Заявка не найдена с id: " + id));

        TicketStatus currentStatus = ticket.getStatus();
        TicketStatus targetStatus = request.getTargetStatus();

        // Check if user is EXECUTOR:
        if (currentUser.getRole() == Role.EXECUTOR) {
            // Must be assigned to this executor
            if (ticket.getAssignee() == null || !ticket.getAssignee().getId().equals(currentUser.getId())) {
                throw new AccessDeniedCustomException("Исполнитель может менять статус только назначенных ему заявок");
            }

            // Executor cannot transition to CLOSED!
            if (targetStatus == TicketStatus.CLOSED) {
                throw new AccessDeniedCustomException("Только менеджер может закрывать заявки (статус CLOSED)");
            }

            if (currentStatus == TicketStatus.ON_REVIEW) {
                throw new AccessDeniedCustomException("Заявка находится на проверке: возврат на доработку или закрытие выполняет только менеджер");
            }

            // Executor can only transition to allowed statuses
            if (!TicketStatus.EXECUTOR_ALLOWED_TARGETS.contains(targetStatus)) {
                throw new AccessDeniedCustomException("Исполнителю запрещен переход в данный статус: " + targetStatus);
            }
        }

        // Validate state machine transition:
        // NEW -> IN_PROGRESS
        // IN_PROGRESS -> WAITING_CLARIFICATION / ON_REVIEW
        // WAITING_CLARIFICATION -> IN_PROGRESS
        // ON_REVIEW -> CLOSED (MANAGER only) or IN_PROGRESS (return for rework)
        if (!currentStatus.canTransitionTo(targetStatus)) {
            throw new InvalidStatusTransitionException(
                    String.format("Недопустимый переход статуса из '%s' в '%s'. Разрешенные переходы: %s",
                            currentStatus, targetStatus, getValidTransitionsDescription(currentStatus)));
        }

        // Check required parameters for specific transitions
        if (targetStatus == TicketStatus.WAITING_CLARIFICATION) {
            if (request.getReason() == null || request.getReason().trim().isBlank()) {
                throw new BadRequestException("При переводе в статус 'Ожидает уточнения' указание причины обязательно");
            }
        }

        if (currentStatus == TicketStatus.ON_REVIEW && targetStatus == TicketStatus.IN_PROGRESS) {
            if (request.getReason() == null || request.getReason().trim().isBlank()) {
                throw new BadRequestException("При возврате заявки с проверки на доработку комментарий обязателен");
            }
        }

        if (request.getResult() != null && !request.getResult().isBlank()) {
            ticket.setResult(request.getResult().trim());
        }

        // Perform transition
        ticket.setStatus(targetStatus);

        if (targetStatus == TicketStatus.CLOSED) {
            ticket.setClosedAt(OffsetDateTime.now());
        }

        Ticket saved = ticketRepository.save(ticket);

        // Record history and comments
        String details = targetStatus.name();
        if (request.getReason() != null && !request.getReason().trim().isBlank()) {
            details += String.format(" (Причина/комментарий: %s)", request.getReason().trim());
            // Also add comment automatically
            commentRepository.save(new TicketComment(saved, currentUser,
                    String.format("[Статус: %s] %s", targetStatus, request.getReason().trim())));
        }

        historyRepository.save(new TicketHistory(saved, currentUser, "STATUS_CHANGE", currentStatus.name(), details));

        eventLogger.logEvent(currentUser.getLogin(), "TICKET_STATUS_CHANGED",
                String.format("Заявка №%d: %s -> %s %s",
                        saved.getNumber(), currentStatus, targetStatus,
                        request.getReason() != null ? "(" + request.getReason() + ")" : ""));

        return TicketDto.fromEntity(saved, true);
    }

    public TicketCommentDto addComment(Long ticketId, CreateCommentRequest request, User currentUser) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Заявка не найдена с id: " + ticketId));

        if (currentUser.getRole() == Role.EXECUTOR) {
            if (ticket.getAssignee() == null || !ticket.getAssignee().getId().equals(currentUser.getId())) {
                throw new AccessDeniedCustomException("Исполнитель может комментировать только назначенные ему заявки");
            }
        }

        TicketComment comment = new TicketComment(ticket, currentUser, request.getText().trim());
        TicketComment saved = commentRepository.save(comment);

        historyRepository.save(new TicketHistory(ticket, currentUser, "COMMENT_ADDED",
                null, "Добавлен комментарий"));

        eventLogger.logEvent(currentUser.getLogin(), "COMMENT_ADDED",
                String.format("Добавлен комментарий к заявке №%d", ticket.getNumber()));

        return TicketCommentDto.fromEntity(saved);
    }

    private String getValidTransitionsDescription(TicketStatus status) {
        return switch (status) {
            case NEW -> "IN_PROGRESS (Принять в работу)";
            case IN_PROGRESS -> "WAITING_CLARIFICATION (Уточнение), ON_REVIEW (На проверку)";
            case WAITING_CLARIFICATION -> "IN_PROGRESS (Возобновить работу)";
            case ON_REVIEW -> "CLOSED (Закрыть, только менеджер), IN_PROGRESS (Возврат на доработку)";
            case CLOSED -> "Нет доступных переходов (конечный статус)";
        };
    }
}
