package com.aauelknight.learning.service;

import com.aauelknight.learning.security.GatewayPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

public abstract class GatewayAwareService {

    protected Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cannot determine user identity");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof GatewayPrincipal gatewayPrincipal) {
            String userId = gatewayPrincipal.userId();
            if (userId != null && !userId.isBlank()) {
                return Long.parseLong(userId);
            }
        }

        Object details = authentication.getDetails();
        if (details instanceof Long value) {
            return value;
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cannot determine user identity");
    }

    protected String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof GatewayPrincipal gatewayPrincipal) {
            return gatewayPrincipal.getUsername();
        }
        if (principal instanceof String value) {
            return value;
        }
        return String.valueOf(principal);
    }
}
