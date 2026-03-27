package com.aauelknight.itas_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import jakarta.annotation.PostConstruct;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private Long jwtExpirationMs;

    private SecretKey signingKey;

    @PostConstruct
    void initializeSigningKey() {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    public String generateToken(UserDetails userDetails) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        io.jsonwebtoken.JwtBuilder builder = Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(now)
                .expiration(expiryDate);

        // If the principal is our domain User, include the role and id as claims
        try {
            if (userDetails instanceof com.aauelknight.itas_backend.entity.User u && u.getRole() != null) {
                String role = u.getRole().getName();
                builder.claim("role", role);
                builder.claim("id", u.getId());
            }
        } catch (Throwable ignored) {
            // Do not fail token generation if optional claims cannot be read
        }

        return builder.signWith(signingKey).compact();
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception ex) {
            log.debug("JWT validation failed: {}", ex.getMessage());
            return false;
        }
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public long getExpirationMs() {
        return jwtExpirationMs;
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
