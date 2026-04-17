package com.parkingapp.service;

import com.parkingapp.domain.User;
import com.parkingapp.repository.UserRepository;
import com.parkingapp.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;


    @Transactional
    public UserResponse registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setCreatedAt(LocalDateTime.now());

        return mapToResponse(userRepository.save(user));
    }


    public LoginResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        String token = jwtTokenProvider.generateToken(auth);

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new LoginResponse(token, mapToResponse(user));
    }


    @Transactional(readOnly = true)
    public UserResponse getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }


    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {
        return userRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }


    private UserResponse mapToResponse(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getCreatedAt());
    }


    public record RegisterRequest(String email, String password) {}

    public record LoginRequest(String email, String password) {}

    public record UserResponse(UUID id, String email, LocalDateTime createdAt) {}

    public record LoginResponse(String token, UserResponse user) {}
}