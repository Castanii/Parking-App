package com.parkingapp.domain;

import com.parkingapp.domain.enums.VehicleCategory;
import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Data
@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "license_plate", nullable = false, unique = true)
    private String licensePlate;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_category", nullable = false)
    private VehicleCategory vehicleCategory;

    @Column(name = "is_electric", nullable = false)
    private boolean electric;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}