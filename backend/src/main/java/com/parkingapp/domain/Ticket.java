package com.parkingapp.domain;

import com.parkingapp.domain.enums.TicketStatus;
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
@Table(name="tickets")
@Entity
public class Ticket {

    @Id
    @GeneratedValue(strategy= GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @JoinColumn(name="vehicle_id")
    @ManyToOne(fetch = FetchType.LAZY)
    private Vehicle vehicle;

    @JoinColumn(name="parking_slot_id")
    @ManyToOne(fetch = FetchType.LAZY)
    private ParkingSlot parkingSlot;

    @Column(name="start_time")
    private LocalDateTime startTime;

    @Column(name="end_time")
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TicketStatus status;
}
