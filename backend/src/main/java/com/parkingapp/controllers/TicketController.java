package com.parkingapp.controllers;

import com.parkingapp.service.TicketService;
import com.parkingapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<TicketService.TicketResponse> buyTicket(
            @RequestBody TicketService.BuyTicketRequest request,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        return new ResponseEntity<>(ticketService.buyTicket(request, userId), HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TicketService.TicketResponse>> getUserTickets(@PathVariable UUID userId) {
        return ResponseEntity.ok(ticketService.getUserTickets(userId));
    }

    @GetMapping("/user/{userId}/active")
    public ResponseEntity<List<TicketService.TicketResponse>> getActiveTickets(@PathVariable UUID userId) {
        return ResponseEntity.ok(ticketService.getActiveTickets(userId));
    }

    @PutMapping("/{id}/end")
    public ResponseEntity<TicketService.TicketResponse> endTicket(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        return ResponseEntity.ok(ticketService.endTicket(id, userId));
    }

    @PutMapping("/{id}/extend")
    public ResponseEntity<TicketService.TicketResponse> extendTicket(
            @PathVariable UUID id,
            @RequestBody TicketService.ExtendRequest request,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        return ResponseEntity.ok(ticketService.extendTicket(id, userId, request));
    }

    @GetMapping("/payments/user/{userId}")
    public ResponseEntity<List<TicketService.PaymentResponse>> getUserPayments(@PathVariable UUID userId) {
        return ResponseEntity.ok(ticketService.getUserPayments(userId));
    }

    private UUID getUserId(Authentication authentication) {
        UserService.UserResponse user = userService.getUserByEmail(authentication.getName());
        return user.id();
    }
}
