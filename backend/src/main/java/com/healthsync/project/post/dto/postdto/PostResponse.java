package com.healthsync.project.post.dto.postdto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.healthsync.project.post.constant.Visibility;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostResponse {

    private Long id;
    private Long userId;
    private String title;
    private String contentTxt;
    private String contentJson;
    private Visibility visibility;
    private boolean blockComment;
    private int likesCount;
    private int viewsCount;
    private boolean likedByMe;
    private boolean bookmarkedByMe;
    private boolean deleted;
    private Long goalId;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate postDate;

    private Instant createdAt;
    private Instant updatedAt;

    @Builder.Default
    private List<String> tags = new ArrayList<>();
}
