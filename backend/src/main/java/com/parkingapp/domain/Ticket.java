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
@Table(name="tickets")
@Entity
public class Ticket {

    @Id
    @GeneratedValue(strategy= GenerationType.UUID)
    private UUID id;
/// Odata ce sunt implementate clasele se poate decomenta momentan da eroare pentru ca hibernate nu vede tabelele de la car user si ParkingSlot
/*    @JoinColumn(name="user_id")
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @JoinColumn(name="car_id")
    @ManyToOne(fetch = FetchType.LAZY)
    private Car car;

    @JoinColumn(name="parkingSlot_id")
    @ManyToOne(fetch = FetchType.LAZY)
    private ParkingSlot parkingSlot;*/

    @Column(name="startTime")
    private LocalDateTime startTime;

    @Column(name="endTime")
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "statusTicket", nullable = false)
    private TicketStatus status;
}
