package com.aauelknight.admin.controller;

import com.aauelknight.admin.dto.UserActivityDto;
import com.aauelknight.admin.service.AnalyticsService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/logs")
@RequiredArgsConstructor
public class SystemLogsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    @PreAuthorize("hasAnyRole('WEB_ADMIN','MANAGER')")
    public ResponseEntity<Page<UserActivityDto>> getAllLogs(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(analyticsService.getActivityLogs(pageable));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('WEB_ADMIN','MANAGER')")
    public ResponseEntity<List<UserActivityDto>> getLogsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(analyticsService.getActivityByUser(userId));
    }
}
