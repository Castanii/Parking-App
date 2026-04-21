package com.parkingapp.service;

import com.parkingapp.domain.User;
import com.parkingapp.domain.Vehicle;
import com.parkingapp.domain.enums.VehicleCategory;
import com.parkingapp.repository.UserRepository;
import com.parkingapp.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;


    @Transactional
    public VehicleResponse addVehicleToUser(UUID userId, VehicleRequest request) {
        if (vehicleRepository.existsByLicensePlate(request.licensePlate())) {
            throw new IllegalArgumentException(
                    "A vehicle with license plate '" + request.licensePlate() + "' already exists.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Vehicle vehicle = new Vehicle();
        vehicle.setLicensePlate(request.licensePlate());
        vehicle.setVehicleCategory(VehicleCategory.valueOf(request.vehicleCategory()));
        vehicle.setElectric(request.isElectric());
        vehicle.setUser(user);

        return mapToResponse(vehicleRepository.save(vehicle));
    }


    @Transactional(readOnly = true)
    public List<VehicleResponse> getVehiclesByUser(UUID userId) {
        return vehicleRepository.findAllByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VehicleResponse getVehicleById(UUID id) {
        return vehicleRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
    }

    @Transactional(readOnly = true)
    Vehicle getVehicleEntityById(UUID id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
    }


    @Transactional
    public void deleteVehicle(UUID id, UUID requestingUserId) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));

        if (!vehicle.getUser().getId().equals(requestingUserId)) {
            throw new IllegalStateException("You can only delete your own vehicles.");
        }

        vehicleRepository.delete(vehicle);
    }


    private VehicleResponse mapToResponse(Vehicle v) {
        return new VehicleResponse(
                v.getId(),
                v.getLicensePlate(),
                v.getVehicleCategory().name(),
                v.isElectric());
    }


    public record VehicleRequest(
            String licensePlate,
            String vehicleCategory,
            boolean isElectric) {}

    public record VehicleResponse(
            UUID id,
            String licensePlate,
            String vehicleCategory,
            boolean electric) {}
}