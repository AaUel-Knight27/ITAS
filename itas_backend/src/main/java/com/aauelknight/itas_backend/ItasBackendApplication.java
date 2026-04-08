package com.aauelknight.itas_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication(scanBasePackages = {"com.aauelknight.itas_backend"})
@EnableAsync
public class ItasBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ItasBackendApplication.class, args);
    }
}

