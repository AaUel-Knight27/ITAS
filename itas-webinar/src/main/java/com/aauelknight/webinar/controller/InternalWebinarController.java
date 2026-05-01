package com.aauelknight.webinar.controller;

import com.aauelknight.webinar.service.WebinarService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalWebinarController {

    private final WebinarService webinarService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(Map.of(
                "totalWebinars", webinarService.countWebinars(),
                "totalRegistrations", webinarService.countRegistrations()
        ));
    }
}
