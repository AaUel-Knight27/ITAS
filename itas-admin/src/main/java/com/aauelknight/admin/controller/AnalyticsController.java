package com.aauelknight.admin.controller;

import com.aauelknight.admin.dto.AnalyticsDashboardDto;
import com.aauelknight.admin.dto.UserActivityDto;
import com.aauelknight.admin.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('WEB_ADMIN','MANAGER')")
    public ResponseEntity<AnalyticsDashboardDto> getDashboard() {
        return ResponseEntity.ok(analyticsService.getDashboard());
    }

    @GetMapping("/activity")
    @PreAuthorize("hasAnyRole('WEB_ADMIN','MANAGER')")
    public ResponseEntity<Page<UserActivityDto>> getActivityLogs(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(analyticsService.getActivityLogs(pageable));
    }
}
