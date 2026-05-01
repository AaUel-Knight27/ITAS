package com.aauelknight.learning.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompletionDto {

    private Long lectureId;
    private boolean completed;
    private LocalDateTime completedAt;
}
