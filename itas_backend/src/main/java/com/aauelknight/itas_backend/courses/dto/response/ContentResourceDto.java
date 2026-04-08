package com.aauelknight.itas_backend.courses.dto.response;

import com.aauelknight.itas_backend.courses.entity.ContentStatus;
import com.aauelknight.itas_backend.courses.entity.ContentType;
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
public class ContentResourceDto {

    private Long id;
    private String title;
    private String description;
    private ContentType type;
    private Long categoryId;
    private String filePath;
    private String thumbnailUrl;
    private boolean downloadAllowed;
    private Long uploadedBy;
    private ContentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
