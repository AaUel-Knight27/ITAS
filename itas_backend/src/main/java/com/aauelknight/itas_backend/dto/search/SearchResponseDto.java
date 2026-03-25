package com.aauelknight.itas_backend.dto.search;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResponseDto {

    private String query;
    private int totalResults;
    private long searchTimeMs;
    private List<SearchResultDto> courses;
    private List<SearchResultDto> lectures;
    private List<String> suggestions;
}
