package com.parkingapp.controllers;

import com.parkingapp.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @PostMapping("/user/{userId}")
    public ResponseEntity<VehicleService.VehicleResponse> addVehicle(
            @PathVariable UUID userId,
            @RequestBody VehicleService.VehicleRequest request) {
        return new ResponseEntity<>(vehicleService.addVehicleToUser(userId, request), HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<VehicleService.VehicleResponse>> getVehicles(@PathVariable UUID userId) {
        return ResponseEntity.ok(vehicleService.getVehiclesByUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleService.VehicleResponse> getVehicle(@PathVariable UUID id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(
            @PathVariable UUID id,
            @RequestParam UUID userId) {
        vehicleService.deleteVehicle(id, userId);
        return ResponseEntity.noContent().build();
    }
}