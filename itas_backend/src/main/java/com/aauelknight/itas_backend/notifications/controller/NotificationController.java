package com.aauelknight.itas_backend.notifications.controller;

import com.aauelknight.itas_backend.notifications.dto.request.CampaignDto;
import com.aauelknight.itas_backend.notifications.dto.request.NotificationRequest;
import com.aauelknight.itas_backend.notifications.service.NotificationService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
}
