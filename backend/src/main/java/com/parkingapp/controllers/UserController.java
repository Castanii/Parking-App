package com.parkingapp.controllers;
import com.parkingapp.service.UserService;
import com.parkingapp.service.UserService.RegisterRequest;
import com.parkingapp.service.UserService.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;


@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@RequestBody RegisterRequest request) {
        return new ResponseEntity<>(userService.registerUser(request), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<UserService.LoginResponse> login(@RequestBody UserService.LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
}