package com.aauelknight.itas_backend.courses.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentVersionDto {

    private Long id;
    private Long lectureId;
    private String lectureTitle;
    private Integer versionNumber;
    private String filePath;
    private String fileType;
    private Long fileSize;
    private String changeNotes;
    private String uploadedByUsername;
    private String createdAt;
    private Boolean isCurrent;
}

