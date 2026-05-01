package com.aauelknight.learning.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoDto {

    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String role;

    public String getFullName() {
        String fn = (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
        return fn.trim().isEmpty() ? username : fn.trim();
    }

    public boolean isEligibleForCertificate() {
        if (role == null) {
            return false;
        }
        String normalized = role.toUpperCase().replace("ROLE_", "");
        return "TAX_AGENT".equals(normalized)
                || "MOR_STAFF".equals(normalized)
                || "MANAGER".equals(normalized);
    }
}
