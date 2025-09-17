package com.healthsync.project.post.dto.postlikedto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LikerResponse {
//    private final Long userId; // 닉네임 눌러 사용자 프로필로 갈때 사용
    private final String nickname;
}
