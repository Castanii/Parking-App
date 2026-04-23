package com.parkingapp.repository;

import com.parkingapp.domain.Reservation;
import com.parkingapp.domain.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

    List<Reservation> findAllByUserIdOrderByScheduledStartDesc(UUID userId);

    List<Reservation> findAllByUserIdAndStatusOrderByScheduledStartAsc(UUID userId, ReservationStatus status);
}
