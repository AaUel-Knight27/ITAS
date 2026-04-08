package com.aauelknight.itas_backend.courses.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchFilterDto {

    private String query;
    private String category;
    private String difficulty;
    private String type;
    private Boolean publishedOnly;
    private String sortBy;
}
