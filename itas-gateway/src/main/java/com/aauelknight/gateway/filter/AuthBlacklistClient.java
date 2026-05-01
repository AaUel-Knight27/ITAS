package com.aauelknight.gateway.filter;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class AuthBlacklistClient {

    private final WebClient webClient;
    private final String authServiceUrl;

    public AuthBlacklistClient(WebClient.Builder webClientBuilder,
                               @Value("${app.services.auth:http://localhost:8081}") String authServiceUrl) {
        this.webClient = webClientBuilder.build();
        this.authServiceUrl = authServiceUrl;
    }

    public boolean isBlacklisted(String token) {
        try {
            Map<?, ?> response = webClient.get()
                    .uri(authServiceUrl + "/internal/tokens/blacklisted?token={token}", token)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            Object value = response == null ? null : response.get("blacklisted");
            return value instanceof Boolean blacklisted && blacklisted;
        } catch (Exception ex) {
            return false;
        }
    }
}
