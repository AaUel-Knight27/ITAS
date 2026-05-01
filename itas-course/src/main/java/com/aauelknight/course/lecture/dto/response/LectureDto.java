package com.aauelknight.course.lecture.dto.response;
import com.aauelknight.course.lecture.entity.LectureType;
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
public class LectureDto {

    private Long id;
    private String title;
    private String description;
    private LectureType type;
    private String videoUrl;
    private String pdfUrl;
    private String content;
    private Integer durationSeconds;
    private Integer orderIndex;
    private boolean preview;
}



