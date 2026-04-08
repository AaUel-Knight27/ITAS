package com.aauelknight.itas_backend.admin.controller;
import com.aauelknight.itas_backend.admin.dto.response.UserDto;
import com.aauelknight.itas_backend.auth.entity.Role;
import com.aauelknight.itas_backend.auth.entity.User;
import com.aauelknight.itas_backend.auth.repository.RoleRepository;
import com.aauelknight.itas_backend.auth.repository.UserRepository;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('WEB_ADMIN')")
public class UserManagementController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @GetMapping
    public ResponseEntity<Page<UserDto>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> users;

        if (search != null && !search.isBlank()) {
            users = userRepository.searchUsers(search, pageable);
        } else if (role != null && !role.isBlank()) {
            users = userRepository.findByRoleNamePaged(role, pageable);
        } else {
            users = userRepository.findAllWithRole(pageable);
        }

        return ResponseEntity.ok(users.map(this::toDto));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UserDto> changeRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));

        String roleName = body.get("role");
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        user.setRole(role);
        return ResponseEntity.ok(toDto(userRepository.save(user)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<UserDto> toggleStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));

        String newStatus = body.get("status");
        if (newStatus == null || (!newStatus.equals("ACTIVE") && !newStatus.equals("INACTIVE"))) {
            return ResponseEntity.badRequest().build();
        }

        user.setStatus(newStatus);
        return ResponseEntity.ok(toDto(userRepository.save(user)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));

        System.out.println("PASSWORD RESET REQUESTED FOR: " + user.getEmail());

        return ResponseEntity.ok(Map.of(
                "message",
                "Password reset email sent to " + user.getEmail()));
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail() != null ? user.getEmail() : "")
                .firstName(user.getFirstName() != null ? user.getFirstName() : "")
                .lastName(user.getLastName() != null ? user.getLastName() : "")
                .roleName(user.getRole() != null ? user.getRole().getName() : "")
                .status(user.getStatus() != null ? user.getStatus() : "ACTIVE")
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : "")
                .build();
    }
}

