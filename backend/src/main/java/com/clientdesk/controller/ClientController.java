package com.clientdesk.controller;

import com.clientdesk.dto.ClientDto;
import com.clientdesk.dto.CreateClientRequest;
import com.clientdesk.dto.TicketDto;
import com.clientdesk.model.User;
import com.clientdesk.service.AuthService;
import com.clientdesk.service.ClientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@Tag(name = "Clients", description = "Управление клиентами и история их заявок")
public class ClientController {

    private final ClientService clientService;
    private final AuthService authService;

    public ClientController(ClientService clientService, AuthService authService) {
        this.clientService = clientService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Получение списка клиентов с поиском")
    public ResponseEntity<List<ClientDto>> getClients(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(clientService.getAllClients(search));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получение карточки клиента по id")
    public ResponseEntity<ClientDto> getClientById(@PathVariable Long id) {
        return ResponseEntity.ok(clientService.getClientById(id));
    }

    @GetMapping("/{id}/tickets")
    @Operation(summary = "История заявок клиента")
    public ResponseEntity<List<TicketDto>> getClientTickets(@PathVariable Long id) {
        return ResponseEntity.ok(clientService.getClientTickets(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Создание клиента (только MANAGER)")
    public ResponseEntity<ClientDto> createClient(@Valid @RequestBody CreateClientRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        ClientDto created = clientService.createClient(request, currentUser.getLogin());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Редактирование клиента (только MANAGER)")
    public ResponseEntity<ClientDto> updateClient(@PathVariable Long id, @Valid @RequestBody CreateClientRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        ClientDto updated = clientService.updateClient(id, request, currentUser.getLogin());
        return ResponseEntity.ok(updated);
    }
}
