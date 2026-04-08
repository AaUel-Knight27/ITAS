package com.aauelknight.itas_backend.auth.controller;

import com.aauelknight.itas_backend.auth.dto.response.JwtResponse;
import com.aauelknight.itas_backend.auth.dto.request.LoginRequest;
import com.aauelknight.itas_backend.auth.entity.User;
import com.aauelknight.itas_backend.auth.repository.UserRepository;
import com.aauelknight.itas_backend.security.JwtUtil;
import com.aauelknight.itas_backend.security.TokenBlacklistService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@Slf4j
public class AuthController {

    private static final String BEARER_PREFIX = "Bearer ";

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final TokenBlacklistService tokenBlacklistService;
    private final SecretKey signingKey;

    public AuthController(AuthenticationManager authenticationManager,  
                          JwtUtil jwtUtil,
                          UserRepository userRepository,
                          TokenBlacklistService tokenBlacklistService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.tokenBlacklistService = tokenBlacklistService;
        this.signingKey = jwtUtil.getSigningKey();
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        UserDetails principal = (UserDetails) authentication.getPrincipal();
        String token = jwtUtil.generateToken(principal);
        log.info("User '{}' logged in", request.getUsername());

        // Try to include role/id/username in the response when available
        String role = null;
        Long id = null;
        String username = principal.getUsername();
        if (principal instanceof User u) {
            id = u.getId();
            if (u.getRole() != null) role = u.getRole().getName();
        }

        return ResponseEntity.ok(JwtResponse.builder()
            .token(token)
            .tokenType("Bearer")
            .expiresIn(jwtUtil.getExpirationMs())
            .role(role)
            .id(id)
            .username(username)
            .build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(
            @RequestHeader(name = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            throw new BadCredentialsException("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(BEARER_PREFIX.length());
        
        try {
            Instant expiry = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getExpiration()
                    .toInstant();

            tokenBlacklistService.blacklist(token, expiry);
        } catch (ExpiredJwtException e) {
            // Token already expired — that's fine, user is effectively logged out already
            log.debug("Logout called with already expired token", e);
        } catch (Exception e) {
            // Malformed token — ignore and proceed to clear context
            log.warn("Logout called with malformed token", e);
        }

        SecurityContextHolder.clearContext();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Logged out successfully");
        response.put("timestamp", Instant.now());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> profile(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User principal)) {
            throw new BadCredentialsException("User is not authenticated");
        }

        User user = userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", user.getId());
        payload.put("username", user.getUsername());
        payload.put("email", user.getEmail());
        payload.put("firstName", user.getFirstName());
        payload.put("lastName", user.getLastName());
        payload.put("role", user.getRole() != null ? user.getRole().getName() : null);
        payload.put("status", user.getStatus());
        payload.put("createdAt", user.getCreatedAt());
        payload.put("updatedAt", user.getUpdatedAt());

        return ResponseEntity.ok(payload);
    }
}

