package com.parkingapp.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name="payments")
@Entity
public class Payment {
    @Id
    @GeneratedValue(strategy= GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="ticket_id",unique = true,nullable = false)
    private Ticket ticket;

    @Column(name="amount",nullable = false)
    private Double amount;

    @Column(name = "currency",nullable = false)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(name = "statusPayment",nullable = false)
    private PaymentStatus paymentStatus;

    @Column(name = "processedAt")
    private LocalDateTime processedAt;
}
