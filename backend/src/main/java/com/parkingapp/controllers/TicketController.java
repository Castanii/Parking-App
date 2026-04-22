package com.parkingapp.controllers;

import com.parkingapp.domain.Ticket;
import com.parkingapp.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {
    private final TicketService ticketService;


    public record ExtensionRequest(int noOfHours) {}

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicket(@PathVariable UUID id) {
        return ResponseEntity.ok(ticketService.findById(id));
    }

    @PutMapping("/{id}/extend")
    public ResponseEntity<String> extendTicket(
            @PathVariable UUID id,
            @RequestParam int noOfHours) {

        Ticket ticket = ticketService.findById(id);
        ticketService.applyExtension(ticket, noOfHours);

        return ResponseEntity.ok("Tichetul a fost prelungit cu succes!");
    }

    @PostMapping("/create")
    public ResponseEntity<Ticket> createTicket(
            @RequestParam UUID userId,
            @RequestParam UUID vehicleId,
            @RequestParam UUID parkingSlotId,
            @RequestParam int hours) {

        Ticket newTicket = ticketService.createTicket(userId, vehicleId, parkingSlotId, hours);

        return new ResponseEntity<>(newTicket, HttpStatus.CREATED);
    }
}
