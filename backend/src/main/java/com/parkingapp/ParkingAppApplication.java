package com.parkingapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ParkingAppApplication {

    public static void main(String[] args) {
        SpringApplication.run(ParkingAppApplication.class, args);
    }

}
