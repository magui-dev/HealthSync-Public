package com.healthsync.project.post.dto.postdto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.healthsync.project.post.constant.Visibility;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostCreateRequest {

    @NotBlank
    @Size(max = 100)
    private String title;

    @NotNull
    private Visibility visibility;

    private boolean blockComment;

    @NotBlank
    private String contentTxt;

    private String contentJson;

    private Long goalId;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate postDate;

    @Builder.Default
    private List<@Size(max = 100) String> tags = new ArrayList<>();
}
