package com.aauelknight.itas_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ContentUpdateRequest {

    @NotBlank(message = "title is required")
    private String title;

    private String description;

    @NotNull(message = "categoryId is required")
    private Long categoryId;

    private String thumbnailUrl;

    @NotNull(message = "downloadAllowed is required")
    private Boolean downloadAllowed;
}
