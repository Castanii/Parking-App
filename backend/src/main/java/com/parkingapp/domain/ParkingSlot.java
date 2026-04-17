package com.parkingapp.domain;

import com.parkingapp.domain.enums.ParkingSlotStatus;
import com.parkingapp.domain.enums.SizeCategory;
import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Data
@Entity
@Table(
        name = "parking_slots",
        indexes = {
                @Index(name = "idx_slot_status", columnList = "status"),
                @Index(name = "idx_slot_area", columnList = "parking_area_id")
        }
)
public class ParkingSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "slot_identifier", nullable = false, unique = true)
    private String slotIdentifier;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ParkingSlotStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "size_category", nullable = false)
    private SizeCategory sizeCategory;

    @Column(name = "has_ev_charging", nullable = false)
    private Boolean hasEvCharging;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_area_id", nullable = false)
    private ParkingArea parkingArea;
}