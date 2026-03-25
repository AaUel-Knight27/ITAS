package com.aauelknight.itas_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.aauelknight.itas_backend"})
public class ItasBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ItasBackendApplication.class, args);
    }
}
