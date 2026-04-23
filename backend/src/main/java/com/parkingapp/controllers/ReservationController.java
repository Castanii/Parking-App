package com.parkingapp.controllers;

import com.parkingapp.service.ReservationService;
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
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<ReservationService.ReservationResponse> create(
            @RequestBody ReservationService.CreateReservationRequest request,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        return new ResponseEntity<>(reservationService.createReservation(request, userId), HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReservationService.ReservationResponse>> getUserReservations(@PathVariable UUID userId) {
        return ResponseEntity.ok(reservationService.getUserReservations(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable UUID id, Authentication authentication) {
        UUID userId = getUserId(authentication);
        reservationService.cancelReservation(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<TicketService.TicketResponse> convertToTicket(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        return ResponseEntity.ok(reservationService.convertToTicket(id, userId));
    }

    private UUID getUserId(Authentication authentication) {
        UserService.UserResponse user = userService.getUserByEmail(authentication.getName());
        return user.id();
    }
}
