package com.aauelknight.itas_backend.dto.faq;

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
    private String createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
