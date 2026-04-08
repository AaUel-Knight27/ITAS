package com.aauelknight.itas_backend.courses.dto.response;

import com.aauelknight.itas_backend.lecture.dto.response.LectureDto;
import java.util.List;
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
public class CourseSectionDto {

    private Long id;
    private String title;
    private String description;
    private Integer orderIndex;
    private List<LectureDto> lectures;
}

