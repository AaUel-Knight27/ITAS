package com.aauelknight.webinar.controller;

import com.aauelknight.webinar.dto.response.AttendeeDto;
import com.aauelknight.webinar.dto.response.WebinarDto;
import com.aauelknight.webinar.dto.response.WebinarRequest;
import com.aauelknight.webinar.security.GatewayPrincipal;
import com.aauelknight.webinar.service.WebinarService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/webinars")
@RequiredArgsConstructor
public class WebinarController {

    private static final String LEARNER_ROLES =
            "hasAnyRole('TAXPAYER','TAX_AGENT','MOR_STAFF','MANAGER')";

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
    @PreAuthorize(LEARNER_ROLES)
    public ResponseEntity<List<WebinarDto>> getMyRegistrations(Authentication authentication) {
        return ResponseEntity.ok(webinarService.getMyRegistrations(requireUserId(authentication)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TRAINING_ADMIN','WEB_ADMIN')")
    public ResponseEntity<WebinarDto> create(@Valid @RequestBody WebinarRequest request,
                                             Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(webinarService.createWebinar(request, requirePrincipal(authentication).username()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRAINING_ADMIN','WEB_ADMIN')")
    public ResponseEntity<WebinarDto> update(@PathVariable Long id,
                                             @Valid @RequestBody WebinarRequest request) {
        return ResponseEntity.ok(webinarService.updateWebinar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRAINING_ADMIN','WEB_ADMIN')")
    public ResponseEntity<Map<String, String>> cancel(@PathVariable Long id) {
        webinarService.cancelWebinar(id);
        return ResponseEntity.ok(Map.of("message", "Webinar cancelled successfully"));
    }

    @GetMapping("/{id}/attendees")
    @PreAuthorize("hasAnyRole('TRAINING_ADMIN','WEB_ADMIN')")
    public ResponseEntity<List<AttendeeDto>> getAttendees(@PathVariable Long id) {
        return ResponseEntity.ok(webinarService.getAttendees(id));
    }

    @PostMapping("/{id}/register")
    @PreAuthorize(LEARNER_ROLES)
    public ResponseEntity<Map<String, String>> register(@PathVariable Long id, Authentication authentication) {
        webinarService.register(id, requireUserId(authentication));
        return ResponseEntity.ok(Map.of("message", "Registered successfully"));
    }

    private GatewayPrincipal requirePrincipal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof GatewayPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal;
    }

    private Long requireUserId(Authentication authentication) {
        GatewayPrincipal principal = requirePrincipal(authentication);
        if (principal.userId() == null || principal.userId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return Long.parseLong(principal.userId());
    }
}
