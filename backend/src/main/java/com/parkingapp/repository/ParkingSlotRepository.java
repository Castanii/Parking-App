package com.parkingapp.repository;

import com.parkingapp.domain.ParkingSlot;
import com.parkingapp.domain.enums.ParkingSlotStatus;
import com.parkingapp.domain.enums.SizeCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, UUID> {
    List<ParkingSlot> findAllByParkingAreaId(UUID parkingAreaId);

    List<ParkingSlot> findAllByParkingAreaIdAndStatus(UUID parkingAreaId, ParkingSlotStatus status);

    List<ParkingSlot> findAllByParkingAreaIdAndStatusAndSizeCategory(
            UUID parkingAreaId, ParkingSlotStatus status, SizeCategory sizeCategory);
}
