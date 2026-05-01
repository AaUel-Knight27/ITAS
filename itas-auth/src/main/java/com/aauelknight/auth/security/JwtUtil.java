package com.aauelknight.auth.security;

import com.aauelknight.auth.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class JwtUtil {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtUtil(
            @Value("${app.jwt.secret:${JWT_SECRET}}") String secret,
            @Value("${app.jwt.expiration-ms:${JWT_EXPIRATION_MS}}") long expirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(resolveSecretBytes(secret));
        this.expirationMs = expirationMs;
    }

    public String generateToken(UserDetails userDetails) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        io.jsonwebtoken.JwtBuilder builder = Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(now)
                .expiration(expiryDate);

        // If the principal is our domain User, include the role and id as claims
        if (userDetails instanceof User u && u.getRole() != null) {
            String role = u.getRole().getName();
            builder.claim("role", role);
            builder.claim("id", u.getId());
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
        return expirationMs;
    }

    public Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }

    public SecretKey getSigningKey() {
        return signingKey;
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private byte[] resolveSecretBytes(String secret) {
        String value = secret == null ? "" : secret.trim();

        if (value.isEmpty()) {
            throw new IllegalStateException("app.jwt.secret must not be blank");
        }

        byte[] decoded = tryDecode(value);
        if (decoded != null && decoded.length >= 32) {
            return decoded;
        }

        byte[] rawBytes = value.getBytes(StandardCharsets.UTF_8);
        if (rawBytes.length >= 32) {
            return rawBytes;
        }

        try {
            return MessageDigest.getInstance("SHA-256").digest(rawBytes);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }

    private byte[] tryDecode(String secret) {
        try {
            return Decoders.BASE64.decode(secret);
        } catch (DecodingException ignored) {
            // Fall through to URL-safe Base64 or raw text.
        }

        try {
            return Decoders.BASE64URL.decode(secret);
        } catch (DecodingException ignored) {
            return null;
        }
    }
}


