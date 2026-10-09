package com.clientdesk.service;

import com.clientdesk.dto.CreateUserRequest;
import com.clientdesk.dto.UpdateUserRequest;
import com.clientdesk.dto.UserDto;
import com.clientdesk.exception.BadRequestException;
import com.clientdesk.exception.ResourceNotFoundException;
import com.clientdesk.model.Role;
import com.clientdesk.model.User;
import com.clientdesk.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EventLogger eventLogger;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       EventLogger eventLogger) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.eventLogger = eventLogger;
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserDto> getActiveExecutors() {
        return userRepository.findByRoleAndActiveTrue(Role.EXECUTOR).stream()
                .map(UserDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден с id: " + id));
        return UserDto.fromEntity(user);
    }

    public UserDto createUser(CreateUserRequest request, String initiatorLogin) {
        if (userRepository.existsByLogin(request.getLogin())) {
            throw new BadRequestException("Пользователь с логином '" + request.getLogin() + "' уже существует");
        }

        User user = new User(
                request.getLogin().trim().toLowerCase(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName().trim(),
                request.getRole(),
                true
        );

        User saved = userRepository.save(user);
        eventLogger.logEvent(initiatorLogin, "USER_CREATED",
                String.format("Создан пользователь: %s (id: %d, роль: %s)", saved.getLogin(), saved.getId(), saved.getRole()));

        return UserDto.fromEntity(saved);
    }

    public UserDto updateUser(Long id, UpdateUserRequest request, String initiatorLogin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден с id: " + id));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        User updated = userRepository.save(user);
        eventLogger.logEvent(initiatorLogin, "USER_UPDATED",
                String.format("Обновлен пользователь: %s (id: %d, active: %b)", updated.getLogin(), updated.getId(), updated.isActive()));

        return UserDto.fromEntity(updated);
    }

    public UserDto toggleUserActive(Long id, String initiatorLogin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден с id: " + id));

        user.setActive(!user.isActive());
        User updated = userRepository.save(user);

        eventLogger.logEvent(initiatorLogin, "USER_STATUS_TOGGLED",
                String.format("Пользователь %s (id: %d) изменен статус active -> %b", updated.getLogin(), updated.getId(), updated.isActive()));

        return UserDto.fromEntity(updated);
    }
}
