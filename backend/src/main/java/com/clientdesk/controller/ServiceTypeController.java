package com.clientdesk.controller;

import com.clientdesk.dto.CreateServiceTypeRequest;
import com.clientdesk.dto.ServiceTypeDto;
import com.clientdesk.model.User;
import com.clientdesk.service.AuthService;
import com.clientdesk.service.ServiceTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-types")
@Tag(name = "Service Types", description = "Справочник видов услуг (редактирование доступно менеджеру)")
public class ServiceTypeController {

    private final ServiceTypeService serviceTypeService;
    private final AuthService authService;

    public ServiceTypeController(ServiceTypeService serviceTypeService, AuthService authService) {
        this.serviceTypeService = serviceTypeService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Получение списка видов услуг")
    public ResponseEntity<List<ServiceTypeDto>> getAll(@RequestParam(defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(serviceTypeService.getAllServiceTypes(activeOnly));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получение вида услуги по id")
    public ResponseEntity<ServiceTypeDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(serviceTypeService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Создание вида услуги (только MANAGER)")
    public ResponseEntity<ServiceTypeDto> create(@Valid @RequestBody CreateServiceTypeRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        ServiceTypeDto created = serviceTypeService.createServiceType(request, currentUser.getLogin());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Обновление вида услуги (только MANAGER)")
    public ResponseEntity<ServiceTypeDto> update(@PathVariable Long id, @Valid @RequestBody CreateServiceTypeRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        ServiceTypeDto updated = serviceTypeService.updateServiceType(id, request, currentUser.getLogin());
        return ResponseEntity.ok(updated);
    }
}
