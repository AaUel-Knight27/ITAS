package com.aauelknight.itas_backend.controller;

import com.aauelknight.itas_backend.dto.notification.AnnouncementDto;
import com.aauelknight.itas_backend.dto.notification.AnnouncementRequest;
import com.aauelknight.itas_backend.service.NotificationService;
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
@RequestMapping("/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AnnouncementDto>> getAll() {
        return ResponseEntity.ok(notificationService.getAllAnnouncements());
    }

    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AnnouncementDto>> getActive() {
        return ResponseEntity.ok(notificationService.getActiveAnnouncements());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<AnnouncementDto> create(
            @Valid @RequestBody AnnouncementRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(notificationService.createAnnouncement(req, userDetails.getUsername()));
    }

    @PutMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<AnnouncementDto> toggle(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.toggleAnnouncement(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        notificationService.deleteAnnouncement(id);
        return ResponseEntity.ok(Map.of("message", "Announcement deleted"));
    }
}
