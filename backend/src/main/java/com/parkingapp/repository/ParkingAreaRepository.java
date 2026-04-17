package com.parkingapp.repository;

import com.parkingapp.domain.ParkingArea;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ParkingAreaRepository extends JpaRepository<ParkingArea, UUID> {
}
