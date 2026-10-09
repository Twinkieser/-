package com.clientdesk.service;

import com.clientdesk.dto.AuthRequest;
import com.clientdesk.dto.AuthResponse;
import com.clientdesk.dto.UserDto;
import com.clientdesk.exception.BadRequestException;
import com.clientdesk.exception.ResourceNotFoundException;
import com.clientdesk.model.User;
import com.clientdesk.repository.UserRepository;
import com.clientdesk.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;
    private final EventLogger eventLogger;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       JwtTokenProvider tokenProvider,
                       EventLogger eventLogger) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.tokenProvider = tokenProvider;
        this.eventLogger = eventLogger;
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByLogin(request.getLogin())
                .orElseThrow(() -> new BadCredentialsException("Неверный логин или пароль"));

        if (!user.isActive()) {
            eventLogger.logEvent(request.getLogin(), "LOGIN_FAILED", "Попытка входа в отключенную учетную запись");
            throw new DisabledException("Учётная запись отключена администратором");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getLogin(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        eventLogger.logEvent(user.getLogin(), "LOGIN_SUCCESS", "Успешная авторизация, роль: " + user.getRole());

        return new AuthResponse(token, user.getId(), user.getLogin(), user.getFullName(), user.getRole());
    }

    public User getCurrentAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new BadCredentialsException("Пользователь не авторизован");
        }
        String username = auth.getName();
        return userRepository.findByLogin(username)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден: " + username));
    }
}
