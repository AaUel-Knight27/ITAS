package com.aauelknight.itas_backend.controller;

import com.aauelknight.itas_backend.dto.webinar.AttendeeDto;
import com.aauelknight.itas_backend.dto.webinar.WebinarDto;
import com.aauelknight.itas_backend.dto.webinar.WebinarRequest;
import com.aauelknight.itas_backend.service.WebinarService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/webinars")
@RequiredArgsConstructor
public class WebinarController {

    private final WebinarService webinarService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<WebinarDto>> getAll() {
        return ResponseEntity.ok(webinarService.getAllWebinars());
    }

    @GetMapping("/upcoming")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<WebinarDto>> getUpcoming() {
        return ResponseEntity.ok(webinarService.getUpcoming());
    }

    @GetMapping("/past")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<WebinarDto>> getPast() {
        return ResponseEntity.ok(webinarService.getPast());
    }

    @GetMapping("/my-registrations")
    @PreAuthorize("hasAnyRole('TAXPAYER', 'TAX_AGENT', 'MOR_STAFF', 'MANAGER')")
    public ResponseEntity<List<WebinarDto>> getMyRegistrations(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(webinarService.getMyRegistrations(userDetails.getUsername()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TRAINING_ADMIN', 'WEB_ADMIN')")
    public ResponseEntity<WebinarDto> create(@Valid @RequestBody WebinarRequest req,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(webinarService.createWebinar(req, userDetails.getUsername()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRAINING_ADMIN', 'WEB_ADMIN')")
    public ResponseEntity<WebinarDto> update(@PathVariable Long id,
                                             @Valid @RequestBody WebinarRequest req) {
        return ResponseEntity.ok(webinarService.updateWebinar(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRAINING_ADMIN', 'WEB_ADMIN')")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        webinarService.cancelWebinar(id);
        return ResponseEntity.ok(Map.of("message", "Webinar cancelled successfully"));
    }

    @GetMapping("/{id}/attendees")
    @PreAuthorize("hasAnyRole('TRAINING_ADMIN', 'WEB_ADMIN')")
    public ResponseEntity<List<AttendeeDto>> getAttendees(@PathVariable Long id) {
        return ResponseEntity.ok(webinarService.getAttendees(id));
    }

    @PostMapping("/{id}/register")
    @PreAuthorize("hasAnyRole('TAXPAYER', 'TAX_AGENT', 'MOR_STAFF', 'MANAGER')")
    public ResponseEntity<?> register(@PathVariable Long id,
                                      @AuthenticationPrincipal UserDetails userDetails) {
        webinarService.register(id, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Registered successfully"));
    }
}
