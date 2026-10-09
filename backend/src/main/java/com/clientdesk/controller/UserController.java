package com.clientdesk.controller;

import com.clientdesk.dto.CreateUserRequest;
import com.clientdesk.dto.UpdateUserRequest;
import com.clientdesk.dto.UserDto;
import com.clientdesk.model.User;
import com.clientdesk.service.AuthService;
import com.clientdesk.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Управление учетными записями пользователей (только MANAGER)")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Получение списка всех пользователей (MANAGER)")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/executors")
    @Operation(summary = "Получение списка активных исполнителей")
    public ResponseEntity<List<UserDto>> getExecutors() {
        return ResponseEntity.ok(userService.getActiveExecutors());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Получение пользователя по id (MANAGER)")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Создание нового пользователя (MANAGER)")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        UserDto created = userService.createUser(request, currentUser.getLogin());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Обновление пользователя (MANAGER)")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        UserDto updated = userService.updateUser(id, request, currentUser.getLogin());
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Включение/отключение учетной записи (MANAGER)")
    public ResponseEntity<UserDto> toggleStatus(@PathVariable Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        UserDto updated = userService.toggleUserActive(id, currentUser.getLogin());
        return ResponseEntity.ok(updated);
    }
}
