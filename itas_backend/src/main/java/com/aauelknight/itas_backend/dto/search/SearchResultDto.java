package com.aauelknight.itas_backend.dto.search;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResultDto {

    private String type;
    private Long id;
    private String title;
    private String description;
    private String thumbnailUrl;
    private String categoryName;
    private String slug;
    private Double relevanceScore;
    private String highlight;
}
