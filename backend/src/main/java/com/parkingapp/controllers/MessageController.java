package com.parkingapp.controllers;

import com.parkingapp.service.MessageService;
import com.parkingapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<MessageService.MessageResponse> sendMessage(
            @RequestBody MessageService.SendMessageRequest request,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        return new ResponseEntity<>(messageService.sendMessage(request, userId), HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<MessageService.MessageResponse>> getUserMessages(@PathVariable UUID userId) {
        return ResponseEntity.ok(messageService.getUserMessages(userId));
    }

    @GetMapping("/thread/{threadId}")
    public ResponseEntity<List<MessageService.MessageResponse>> getThread(@PathVariable String threadId) {
        return ResponseEntity.ok(messageService.getThread(threadId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id, Authentication authentication) {
        UUID userId = getUserId(authentication);
        messageService.markAsRead(id, userId);
        return ResponseEntity.noContent().build();
    }

    private UUID getUserId(Authentication authentication) {
        UserService.UserResponse user = userService.getUserByEmail(authentication.getName());
        return user.id();
    }
}
