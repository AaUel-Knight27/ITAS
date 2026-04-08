package com.aauelknight.itas_backend.security;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class TokenBlacklistService {

    private final Map<String, Instant> blacklistedTokens = new ConcurrentHashMap<>();

    public void blacklist(String token, Instant expiresAt) {
        cleanupExpired();
        blacklistedTokens.put(token, expiresAt);
        log.info("Token blacklisted until {}", expiresAt);
    }

    public boolean isBlacklisted(String token) {
        cleanupExpired();
        Instant expiry = blacklistedTokens.get(token);
        return expiry != null && expiry.isAfter(Instant.now());
    }

    private void cleanupExpired() {
        Instant now = Instant.now();
        blacklistedTokens.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
    }
}

