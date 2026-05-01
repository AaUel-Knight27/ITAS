package com.aauelknight.webinar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class WebinarApplication {

    public static void main(String[] args) {
        SpringApplication.run(WebinarApplication.class, args);
    }
}
