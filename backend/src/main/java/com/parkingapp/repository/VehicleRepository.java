package com.parkingapp.repository;

import com.parkingapp.domain.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {

    List<Vehicle> findAllByUserId(UUID userId);

    boolean existsByLicensePlate(String licensePlate);}
