package com.healthsync.project.post.dto.commentdto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentCreateRequest {
    @NotBlank
    private String content;
}