package com.aauelknight.gateway.filter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component("JwtAuthFilter")
public class JwtAuthFilter extends AbstractGatewayFilterFactory<Object> {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final List<String> PUBLIC_PREFIXES = List.of(
            "/api/v1/auth/",
            "/api/v1/verify/",
            "/api/v1/uploads/",
            "/actuator/"
    );

    private final SecretKey signingKey;
    private final AuthBlacklistClient authBlacklistClient;
    private final ObjectMapper objectMapper;

    public JwtAuthFilter(@Value("${app.jwt.secret}") String secret,
                         AuthBlacklistClient authBlacklistClient,
                         ObjectMapper objectMapper) {
        this.signingKey = Keys.hmacShaKeyFor(resolveSecretBytes(secret));
        this.authBlacklistClient = authBlacklistClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public GatewayFilter apply(Object config) {
        return (exchange, chain) -> {
            String path = exchange.getRequest().getURI().getPath();
            if (isPublicPath(path)) {
                return chain.filter(exchange);
            }

            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
                return writeJson(exchange, HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication required");
            }

            String token = authHeader.substring(BEARER_PREFIX.length()).trim();
            if (token.isEmpty()) {
                return writeJson(exchange, HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication required");
            }

            if (authBlacklistClient.isBlacklisted(token)) {
                return writeJson(exchange, HttpStatus.FORBIDDEN, "Forbidden", "Token has been revoked");
            }

            Claims claims;
            try {
                claims = Jwts.parser()
                        .verifyWith(signingKey)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();
            } catch (Exception ex) {
                return writeJson(exchange, HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication required");
            }

            String username = claims.getSubject();
            Object roleValue = claims.get("role");
            Object userIdValue = claims.get("id");
            if (username == null || username.isBlank() || roleValue == null) {
                return writeJson(exchange, HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication required");
            }

            ServerWebExchange mutatedExchange = exchange.mutate()
                    .request(exchange.getRequest().mutate()
                            .headers(headers -> {
                                headers.remove(HttpHeaders.AUTHORIZATION);
                                headers.set("X-Auth-Username", username);
                                headers.set("X-Auth-Role", String.valueOf(roleValue));
                                if (userIdValue != null) {
                                    headers.set("X-Auth-User-Id", String.valueOf(userIdValue));
                                }
                            })
                            .build())
                    .build();

            return chain.filter(mutatedExchange);
        };
    }

    private boolean isPublicPath(String path) {
        return PUBLIC_PREFIXES.stream().anyMatch(path::startsWith);
    }

    private Mono<Void> writeJson(ServerWebExchange exchange,
                                 HttpStatus status,
                                 String error,
                                 String message) {
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);

        byte[] payload;
        try {
            payload = objectMapper.writeValueAsBytes(body);
        } catch (JsonProcessingException ex) {
            payload = ("{\"status\":" + status.value()
                    + ",\"error\":\"" + error
                    + "\",\"message\":\"" + message + "\"}")
                    .getBytes(StandardCharsets.UTF_8);
        }

        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(payload);
        return exchange.getResponse().writeWith(Mono.just(buffer));
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

        byte[] raw = value.getBytes(StandardCharsets.UTF_8);
        if (raw.length >= 32) {
            return raw;
        }

        try {
            return MessageDigest.getInstance("SHA-256").digest(raw);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }

    private byte[] tryDecode(String secret) {
        try {
            return Decoders.BASE64.decode(secret);
        } catch (Exception ignored) {
            // fall through
        }

        try {
            return Decoders.BASE64URL.decode(secret);
        } catch (Exception ignored) {
            return null;
        }
    }
}
