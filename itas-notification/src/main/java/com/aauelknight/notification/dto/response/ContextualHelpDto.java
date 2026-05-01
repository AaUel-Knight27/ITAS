package com.aauelknight.notification.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContextualHelpDto {

    private String pageId;
    private String fieldId;
    private List<HelpArticleDto> articles;
}
