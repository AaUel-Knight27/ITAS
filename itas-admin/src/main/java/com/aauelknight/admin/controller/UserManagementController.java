package com.aauelknight.admin.controller;

import com.aauelknight.admin.client.AuthServiceClient;
import com.aauelknight.admin.dto.UserInfoDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class UserManagementController {

    private final AuthServiceClient authServiceClient;

    @GetMapping
    @PreAuthorize("hasAnyRole('WEB_ADMIN','MANAGER')")
    public ResponseEntity<List<UserInfoDto>> getAllUsers(
            @RequestParam(required = false, defaultValue = "") String q) {
        return ResponseEntity.ok(authServiceClient.searchUsers(q));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('WEB_ADMIN','MANAGER')")
    public ResponseEntity<UserInfoDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(authServiceClient.getUserById(id));
    }
}
