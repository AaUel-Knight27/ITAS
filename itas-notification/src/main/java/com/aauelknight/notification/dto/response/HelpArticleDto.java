package com.aauelknight.notification.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HelpArticleDto {

    private Long id;
    private String title;
    private String content;
    private String pageId;
    private String fieldId;
    private String category;
    private String tags;
    private Boolean isPublished;
    private Integer viewCount;
    private String createdAt;
    private String updatedAt;
}
