package com.aauelknight.itas_backend.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchDto {

    private Long id;
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String fullName;
}
