package com.parkingapp.repository;

import com.parkingapp.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Payment> findAllByTicketId(UUID ticketId);

    Optional<Payment> findTopByTicketIdOrderByCreatedAtDesc(UUID ticketId);
}
