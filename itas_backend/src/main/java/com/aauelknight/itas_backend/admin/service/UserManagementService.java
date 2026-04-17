package com.aauelknight.itas_backend.admin.service;

import com.aauelknight.itas_backend.admin.dto.response.UserSearchDto;
import com.aauelknight.itas_backend.auth.entity.User;
import com.aauelknight.itas_backend.auth.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserSearchDto> searchUsers(String query, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 25));

        return userRepository.searchUsers(query, PageRequest.of(0, safeLimit)).getContent()
                .stream()
                .map(this::toUserSearchDto)
                .toList();
    }

    private UserSearchDto toUserSearchDto(User user) {
        String firstName = user.getFirstName() != null ? user.getFirstName() : "";
        String lastName = user.getLastName() != null ? user.getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();

        return UserSearchDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .firstName(firstName)
                .lastName(lastName)
                .email(user.getEmail() != null ? user.getEmail() : "")
                .role(user.getRole() != null ? user.getRole().getName() : "")
                .fullName(fullName)
                .build();
    }
}
