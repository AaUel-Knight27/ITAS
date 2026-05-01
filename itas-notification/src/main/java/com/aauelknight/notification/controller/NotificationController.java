package com.aauelknight.notification.controller;

import com.aauelknight.notification.dto.request.CampaignDto;
import com.aauelknight.notification.dto.request.NotificationRequest;
import com.aauelknight.notification.dto.request.SingleNotificationRequest;
import com.aauelknight.notification.service.NotificationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController extends UserContextSupport {

    private final NotificationService notificationService;

    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<CampaignDto> send(@Valid @RequestBody NotificationRequest request,
                                            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(notificationService.sendNotification(request, requireUsername(authentication)));
    }

    @PostMapping("/send/user/{userId}")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<Map<String, Object>> sendToUser(@PathVariable Long userId,
                                                          @Valid @RequestBody SingleNotificationRequest request,
                                                          Authentication authentication) {
        notificationService.sendToSingleUser(userId, request, requireUsername(authentication));
        return ResponseEntity.ok(Map.of("message", "Notification sent successfully", "recipientId", userId));
    }

    @GetMapping("/campaigns")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN','MANAGER')")
    public ResponseEntity<List<CampaignDto>> getCampaigns() {
        return ResponseEntity.ok(notificationService.getAllCampaigns());
    }
}
