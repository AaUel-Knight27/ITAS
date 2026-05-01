package com.aauelknight.admin.controller;

import com.aauelknight.admin.dto.IntegrationSyncDto;
import com.aauelknight.admin.security.GatewayPrincipal;
import com.aauelknight.admin.service.IntegrationSyncService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/admin/integrations")
@RequiredArgsConstructor
public class IntegrationSyncController {

    private final IntegrationSyncService syncService;

    @GetMapping
    @PreAuthorize("hasRole('WEB_ADMIN')")
    public ResponseEntity<List<IntegrationSyncDto>> getAllSyncLogs() {
        return ResponseEntity.ok(syncService.getAllSyncLogs());
    }

    @GetMapping("/system/{systemName}")
    @PreAuthorize("hasRole('WEB_ADMIN')")
    public ResponseEntity<List<IntegrationSyncDto>> getBySystem(@PathVariable String systemName) {
        return ResponseEntity.ok(syncService.getSyncLogsBySystem(systemName));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('WEB_ADMIN')")
    public ResponseEntity<IntegrationSyncDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(syncService.getSyncLog(id));
    }

    @PostMapping("/trigger")
    @PreAuthorize("hasRole('WEB_ADMIN')")
    public ResponseEntity<IntegrationSyncDto> triggerSync(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String systemName = body.get("systemName");
        String syncType = body.get("syncType");
        if (systemName == null || syncType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "systemName and syncType are required");
        }
        String username = requireUsername(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(syncService.triggerSync(systemName, syncType, username));
    }

    private String requireUsername(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof GatewayPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal.username();
    }
}
