package com.aauelknight.itas_backend.admin.controller;
import com.aauelknight.itas_backend.admin.dto.request.SyncLogDto;
import com.aauelknight.itas_backend.admin.dto.request.SyncRequestDto;
import com.aauelknight.itas_backend.admin.dto.request.SyncStatsDto;
import com.aauelknight.itas_backend.admin.service.IntegrationSyncService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/integrations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('WEB_ADMIN')")
public class IntegrationSyncController {

    private final IntegrationSyncService syncService;

    @GetMapping("/stats")
    public ResponseEntity<SyncStatsDto> getStats() {
        return ResponseEntity.ok(syncService.getStats());
    }

    @GetMapping("/logs")
    public ResponseEntity<Page<SyncLogDto>> getLogs(
            @RequestParam(required = false) String systemName,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(syncService.getAllLogs(systemName, status, page, size));
    }

    @GetMapping("/logs/{id}")
    public ResponseEntity<SyncLogDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(syncService.getById(id));
    }

    @PostMapping("/trigger")
    public ResponseEntity<SyncLogDto> triggerSync(
            @Valid @RequestBody SyncRequestDto req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(syncService.triggerSync(req, userDetails.getUsername()));
    }

    @PostMapping("/logs/{id}/retry")
    public ResponseEntity<SyncLogDto> retry(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(syncService.retrySync(id, userDetails.getUsername()));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export() {
        byte[] csv = syncService.exportToCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=sync-logs.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}

