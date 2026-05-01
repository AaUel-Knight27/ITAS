package com.aauelknight.auth.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserInfoDto {
    Long id;
    String username;
    String email;
    String firstName;
    String lastName;
    String role;
}
