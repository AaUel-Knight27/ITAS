package com.aauelknight.itas_backend.controller;

import com.aauelknight.itas_backend.dto.notification.CampaignDto;
import com.aauelknight.itas_backend.dto.notification.NotificationRequest;
import com.aauelknight.itas_backend.dto.notification.UserNotificationDto;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<CampaignDto> send(
            @Valid @RequestBody NotificationRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(notificationService.sendNotification(req, userDetails.getUsername()));
    }

    @GetMapping("/campaigns")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN','MANAGER')")
    public ResponseEntity<List<CampaignDto>> getCampaigns() {
        return ResponseEntity.ok(notificationService.getAllCampaigns());
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserNotificationDto>> getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(notificationService.getMyNotifications(userDetails.getUsername()));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        long count = notificationService.getUnreadCount(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        notificationService.markAsRead(id, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }

    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails) {
        notificationService.markAllAsRead(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }
}
