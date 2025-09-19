package com.healthsync.project.openai.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class OpenAiRequest {

    // 사용할 모델명
    private String model;

    // 메세지 리스트
    private List<OpenAiMessage> messages;

}
/**
 필드명	    필수 여부	 설명
 model     	   ✅	   사용할 모델
 messages	   ✅	   대화 맥락을 담은 메세지 배열
 temperature   ❌	   창의성 조절 (0 ~ 2), 높을수록 랜덤
 max_tokens	   ❌	   응답 최대 길이 (토큰 단위)
 tep_p	       ❌	   확률 기반 샘플링 조절
 stop	       ❌	   응답 중단 시점 트리거 문자열
 stream	       ❌	   응답을 스트리밍 받을지에 대한 여부
 n	           ❌	   응답 개수 (기본 1개)
 */