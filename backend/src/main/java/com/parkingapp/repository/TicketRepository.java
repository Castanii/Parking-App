package com.parkingapp.repository;

import com.parkingapp.domain.Ticket;
import com.parkingapp.domain.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    List<Ticket> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Ticket> findAllByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, TicketStatus status);

    List<Ticket> findAllByStatusAndEndTimeBefore(TicketStatus status, LocalDateTime time);

    boolean existsByVehicleIdAndStatus(UUID vehicleId, TicketStatus status);
}
