package com.aauelknight.webinar.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendeeDto {

    private Long userId;
    private String username;
    private String email;
    private String fullName;
    private LocalDateTime registeredAt;
    private Boolean attended;
}
