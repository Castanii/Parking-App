package com.parkingapp.controllers;

import com.parkingapp.domain.enums.SizeCategory;
import com.parkingapp.service.ParkingAreaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/parking-areas")
@RequiredArgsConstructor
public class ParkingAreaController {

    private final ParkingAreaService parkingAreaService;

    @PostMapping
    public ResponseEntity<ParkingAreaService.ParkingAreaResponse> create(@RequestBody ParkingAreaService.ParkingAreaRequest request) {
        return new ResponseEntity<>(parkingAreaService.createParkingArea(request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ParkingAreaService.ParkingAreaResponse>> getAll() {
        return ResponseEntity.ok(parkingAreaService.getAllParkingAreas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ParkingAreaService.ParkingAreaResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(parkingAreaService.getParkingAreaById(id));
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<ParkingAreaService.ParkingAreaResponse>> findNearby(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam double radius) {
        return ResponseEntity.ok(parkingAreaService.findNearby(lat, lon, radius));
    }

    @GetMapping("/{id}/available-slots")
    public ResponseEntity<List<ParkingAreaService.SlotResponse>> getAvailableSlots(
            @PathVariable UUID id,
            @RequestParam(required = false) SizeCategory size) {
        return ResponseEntity.ok(parkingAreaService.getAvailableSlots(id, size));
    }
}
