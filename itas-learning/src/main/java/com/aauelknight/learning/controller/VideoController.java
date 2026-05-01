package com.aauelknight.learning.controller;

import com.aauelknight.learning.dto.request.VideoProgressRequest;
import com.aauelknight.learning.dto.response.VideoProgressDto;
import com.aauelknight.learning.security.GatewayPrincipal;
import com.aauelknight.learning.service.VideoProgressService;
import jakarta.validation.Valid;
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
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/lms/video")
public class VideoController {

    private final VideoProgressService videoProgressService;

    public VideoController(VideoProgressService videoProgressService) {
        this.videoProgressService = videoProgressService;
    }

    @PostMapping("/{lectureId}/progress")
    @PreAuthorize("hasAnyRole('TAXPAYER','TAX_AGENT','MOR_STAFF','MANAGER')")
    public ResponseEntity<Void> saveVideoProgress(@PathVariable Long lectureId,
                                                  @Valid @RequestBody VideoProgressRequest request,
                                                  Authentication authentication) {
        videoProgressService.saveProgress(requireUserId(authentication), lectureId, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{lectureId}/progress")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VideoProgressDto> getProgress(@PathVariable Long lectureId, Authentication authentication) {
        return ResponseEntity.ok(videoProgressService.getProgress(requireUserId(authentication), lectureId));
    }

    private Long requireUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof GatewayPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (principal.userId() == null || principal.userId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return Long.parseLong(principal.userId());
    }
}
