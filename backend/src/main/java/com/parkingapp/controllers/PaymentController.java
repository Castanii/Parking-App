package com.parkingapp.controllers;

import com.parkingapp.domain.Payment;
import com.parkingapp.domain.Ticket;
import com.parkingapp.service.PaymentService;
import com.parkingapp.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;
    private final TicketService ticketService;

    @PostMapping("/process")
    public ResponseEntity<Payment> processPayment(
            @RequestParam UUID ticketId,
            @RequestParam Double amount,
            @RequestParam String currency) {

        Ticket ticket = ticketService.findById(ticketId);

        Payment processedPayment = paymentService.processPayment(
                ticket,
                amount,
                currency
        );

        return new ResponseEntity<>(processedPayment, HttpStatus.CREATED);
    }
}
