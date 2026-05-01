package com.aauelknight.notification.controller;

import com.aauelknight.notification.security.GatewayPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

abstract class UserContextSupport {

    protected String requireUsername(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof GatewayPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal.username();
    }
}
