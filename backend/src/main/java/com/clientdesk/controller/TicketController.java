package com.clientdesk.controller;

import com.clientdesk.dto.*;
import com.clientdesk.model.Priority;
import com.clientdesk.model.TicketStatus;
import com.clientdesk.model.User;
import com.clientdesk.service.AuthService;
import com.clientdesk.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@Tag(name = "Tickets", description = "Управление заявками, статусы, комментарии и история")
public class TicketController {

    private final TicketService ticketService;
    private final AuthService authService;

    public TicketController(TicketService ticketService, AuthService authService) {
        this.ticketService = ticketService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Список заявок с фильтрами, поиском и пагинацией")
    public ResponseEntity<Page<TicketDto>> getTickets(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) Boolean overdue,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc") ?
                Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        User currentUser = authService.getCurrentAuthenticatedUser();
        Page<TicketDto> result = ticketService.getTickets(search, status, assigneeId, priority, overdue, dateFrom, dateTo, pageable, currentUser);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/my")
    @Operation(summary = "Раздел 'Мои задачи' для исполнителя (ближайшие сроки и задачи в работе)")
    public ResponseEntity<List<TicketDto>> getMyTasks() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(ticketService.getMyTasks(currentUser));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Карточка заявки с комментариями и историей изменений")
    public ResponseEntity<TicketDto> getTicketById(@PathVariable Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(ticketService.getTicketById(id, currentUser));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Регистрация новой заявки (только MANAGER)")
    public ResponseEntity<TicketDto> createTicket(@Valid @RequestBody CreateTicketRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        TicketDto created = ticketService.createTicket(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Редактирование параметров заявки (только MANAGER)")
    public ResponseEntity<TicketDto> updateTicket(@PathVariable Long id, @Valid @RequestBody UpdateTicketRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        TicketDto updated = ticketService.updateTicket(id, request, currentUser);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Смена статуса заявки с проверкой правил переходов и прав ролей")
    public ResponseEntity<TicketDto> changeStatus(@PathVariable Long id, @Valid @RequestBody StatusChangeRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        TicketDto updated = ticketService.changeTicketStatus(id, request, currentUser);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "Добавление комментария к заявке")
    public ResponseEntity<TicketCommentDto> addComment(@PathVariable Long id, @Valid @RequestBody CreateCommentRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        TicketCommentDto comment = ticketService.addComment(id, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }
}
