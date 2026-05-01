package com.aauelknight.auth.controller;

import com.aauelknight.auth.dto.response.UserInfoDto;
import com.aauelknight.auth.entity.User;
import com.aauelknight.auth.repository.UserRepository;
import com.aauelknight.auth.security.TokenBlacklistService;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/internal")
public class InternalAuthController {

    private final UserRepository userRepository;
    private final TokenBlacklistService tokenBlacklistService;

    public InternalAuthController(UserRepository userRepository,
                                  TokenBlacklistService tokenBlacklistService) {
        this.userRepository = userRepository;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @GetMapping("/users/{id}")
    public UserInfoDto getUserById(@PathVariable Long id) {
        return toDto(userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")));
    }

    @GetMapping("/users/username/{username}")
    public UserInfoDto getUserByUsername(@PathVariable String username) {
        return toDto(userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")));
    }

    @PostMapping("/users/validate")
    public UserInfoDto validateUser(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username is required");
        }
        return getUserByUsername(username);
    }

    @GetMapping("/tokens/blacklisted")
    public Map<String, Boolean> isBlacklisted(@RequestParam String token) {
        return Map.of("blacklisted", tokenBlacklistService.isBlacklisted(token));
    }

    @GetMapping("/users/search")
    public List<UserInfoDto> searchUsers(@RequestParam(required = false) String q) {
        String query = (q == null || q.isBlank()) ? "" : q.trim();
        if (query.isEmpty()) {
            return userRepository.findAll().stream().map(this::toDto).toList();
        }
        return userRepository.searchUsers(query, Pageable.unpaged())
                .getContent().stream().map(this::toDto).toList();
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("userCount", userRepository.count());
        payload.put("usersByRole", userRepository.countUsersByRole().stream()
                .collect(LinkedHashMap::new,
                        (map, row) -> map.put(String.valueOf(row[0]), row[1]),
                        LinkedHashMap::putAll));
        return payload;
    }

    private UserInfoDto toDto(User user) {
        return UserInfoDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .build();
    }
}
