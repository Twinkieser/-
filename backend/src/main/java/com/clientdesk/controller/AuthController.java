package com.clientdesk.controller;

import com.clientdesk.dto.AuthRequest;
import com.clientdesk.dto.AuthResponse;
import com.clientdesk.dto.UserDto;
import com.clientdesk.model.User;
import com.clientdesk.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Авторизация и профиль текущего пользователя")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Вход в систему по логину и паролю")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Получение информации о текущем авторизованном пользователе")
    public ResponseEntity<UserDto> getCurrentUser() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(UserDto.fromEntity(user));
    }
}
