package com.parkingapp.service;

import com.parkingapp.domain.ParkingArea;
import com.parkingapp.domain.ParkingSlot;
import com.parkingapp.domain.enums.ParkingSlotStatus;
import com.parkingapp.domain.enums.SizeCategory;
import com.parkingapp.repository.ParkingAreaRepository;
import com.parkingapp.repository.ParkingSlotRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ParkingAreaService {

    private final ParkingAreaRepository parkingAreaRepository;
    private final ParkingSlotRepository parkingSlotRepository;

    // WGS-84 SRID used by PostGIS/GPS
    private static final GeometryFactory GEO_FACTORY =
            new GeometryFactory(new PrecisionModel(), 4326);

    @Transactional
    public ParkingAreaResponse createParkingArea(ParkingAreaRequest request) {
        ParkingArea area = new ParkingArea();
        area.setName(request.name());
        area.setAddress(request.address());
        area.setCapacity(request.capacity());
        area.setHourlyRate(request.hourlyRate());
        // JTS Point: x = longitude, y = latitude
        area.setLocation(buildPoint(request.longitude(), request.latitude()));

        return mapToResponse(parkingAreaRepository.save(area));
    }

    @Transactional(readOnly = true)
    public ParkingAreaResponse getParkingAreaById(UUID id) {
        return parkingAreaRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Parking area not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<ParkingAreaResponse> getAllParkingAreas() {
        return parkingAreaRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ParkingAreaResponse> findNearby(double latitude, double longitude, double radiusMeters) {
        Point searchCenter = buildPoint(longitude, latitude);
        double radiusInDegrees = radiusMeters / 111320.0;

        return parkingAreaRepository.findAll().stream()
                .filter(area -> area.getLocation() != null && area.getLocation().distance(searchCenter) <= radiusInDegrees)
                .sorted(Comparator.comparingDouble(a -> a.getLocation().distance(searchCenter)))
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SlotResponse> getAvailableSlots(UUID areaId, SizeCategory sizeCategory) {
        List<ParkingSlot> slots = (sizeCategory != null)
                ? parkingSlotRepository.findAllByParkingAreaIdAndStatusAndSizeCategory(
                areaId, ParkingSlotStatus.AVAILABLE, sizeCategory)
                : parkingSlotRepository.findAllByParkingAreaIdAndStatus(
                areaId, ParkingSlotStatus.AVAILABLE);

        return slots.stream().map(this::mapSlotToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SlotResponse> getAllSlots(UUID areaId) {
        return parkingSlotRepository.findAllByParkingAreaId(areaId)
                .stream()
                .map(this::mapSlotToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    ParkingSlot getSlotEntityById(UUID id) {
        return parkingSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parking slot not found: " + id));
    }

    private Point buildPoint(double longitude, double latitude) {
        Point p = GEO_FACTORY.createPoint(new Coordinate(longitude, latitude));
        p.setSRID(4326);
        return p;
    }

    private ParkingAreaResponse mapToResponse(ParkingArea area) {
        return new ParkingAreaResponse(
                area.getId(),
                area.getName(),
                area.getAddress(),
                area.getCapacity(),
                area.getHourlyRate(),
                area.getLocation().getY(),   // latitude = y
                area.getLocation().getX());  // longitude = x
    }

    private SlotResponse mapSlotToResponse(ParkingSlot slot) {
        return new SlotResponse(
                slot.getId(),
                slot.getSlotIdentifier(),
                slot.getStatus().name(),
                slot.getSizeCategory() != null ? slot.getSizeCategory().name() : null,
                slot.getHasEvCharging());
    }

    public record ParkingAreaRequest(
            String name, String address, Integer capacity, Double hourlyRate, double latitude, double longitude) {}

    public record ParkingAreaResponse(
            UUID id, String name, String address, Integer capacity, Double hourlyRate, double latitude, double longitude) {}

    public record SlotResponse(
            UUID id, String slotIdentifier, String status, String sizeCategory, Boolean hasEvCharging) {}
}