package com.aauelknight.itas_backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VideoProgressRequest {

    @NotNull(message = "watchedSeconds is required")
    @Min(value = 0, message = "watchedSeconds must be >= 0")
    private Integer watchedSeconds;

    @NotNull(message = "lastPosition is required")
    @Min(value = 0, message = "lastPosition must be >= 0")
    private Integer lastPosition;

    @Min(value = 0, message = "completionPercentage must be >= 0")
    private Integer completionPercentage;
}
