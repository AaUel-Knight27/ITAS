package com.aauelknight.notification.client;

import com.aauelknight.notification.dto.UserInfoDto;
import java.util.Arrays;
import java.util.List;
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

    public List<UserInfoDto> searchUsers(String query) {
        try {
            UserInfoDto[] users = restTemplate.getForObject(
                    authServiceUrl + "/internal/users/search?q=" + (query == null ? "" : query),
                    UserInfoDto[].class);
            return users == null ? List.of() : Arrays.asList(users);
        } catch (Exception ex) {
            log.error("Auth service unavailable for query {}: {}", query, ex.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Auth service unavailable");
        }
    }
}
