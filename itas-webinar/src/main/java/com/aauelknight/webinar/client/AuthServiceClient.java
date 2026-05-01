package com.aauelknight.webinar.client;

import com.aauelknight.webinar.dto.UserInfoDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Component
@Slf4j
public class AuthServiceClient {

    private final RestTemplate restTemplate;
    private final String authServiceUrl;

    public AuthServiceClient(RestTemplate restTemplate,
                             @Value("${services.auth-url:http://localhost:8081}") String authServiceUrl) {
        this.restTemplate = restTemplate;
        this.authServiceUrl = authServiceUrl;
    }

    public UserInfoDto getUserById(Long userId) {
        try {
            return restTemplate.getForObject(authServiceUrl + "/internal/users/" + userId, UserInfoDto.class);
        } catch (Exception ex) {
            log.error("Auth service unavailable for user id {}: {}", userId, ex.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Auth service unavailable");
        }
    }

    public UserInfoDto getUserByUsername(String username) {
        try {
            return restTemplate.getForObject(authServiceUrl + "/internal/users/username/" + username, UserInfoDto.class);
        } catch (Exception ex) {
            log.error("Auth service unavailable for username {}: {}", username, ex.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Auth service unavailable");
        }
    }
}
