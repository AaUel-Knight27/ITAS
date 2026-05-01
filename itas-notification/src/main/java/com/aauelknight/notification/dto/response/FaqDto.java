package com.aauelknight.notification.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaqDto {

    private Long id;
    private String question;
    private String answer;
    private String category;
    private Integer orderIndex;
    private LocalDateTime createdAt;
}
