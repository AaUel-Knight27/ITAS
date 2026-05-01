package com.aauelknight.notification.controller;

import com.aauelknight.notification.client.AuthServiceClient;
import com.aauelknight.notification.dto.UserInfoDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AuthServiceClient authServiceClient;

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<List<UserInfoDto>> search(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(authServiceClient.searchUsers(q));
    }
}
