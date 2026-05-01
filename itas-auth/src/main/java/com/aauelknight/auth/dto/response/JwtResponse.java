package com.aauelknight.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class JwtResponse {

    private String token;
    private String tokenType;
    private long expiresIn;
    private String role;
    private Long id;
    private String username;
}


