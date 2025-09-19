package com.healthsync.project.openai.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OpenAiMessage {

    // 메세지 역할 (user, assistant, system)
    private String role;

    // 메세지 내용
    private String content;
}
/**
 OpenAiMessage DTO에서 role은 메세지를 누가 보냈는지를 정의합니다.

 system
 AI의 동작 방식 또는 성격을 정의하는 지침 역할로 대화 전체의 맥락을 잡아주고, ChatGPT가 어떤 인격이나 행동 지침으로 동작해야 하는지 정의하는 메세지입니다.
 챗봇의 행동 원칙, 대화 스타일 및 어조 지정, 금지/허용 사항 설정 등이 가능합니다.
 user
 실제 사용자 입력 (질문, 요청 등)으로 질문, 요구사항, 명령 등을 의미합니다.
 assistant
 모델이 이전에 생성한 응답으로 모델 자신이 사용자에게 제공하는 실제 답변입니다.
 이전에 생성된 답변을 assistant 메세지 형태로 저장해두면, 모델이 과거 대화 맥락을 참고할 수 있습니다.
 예를들어, system : "tao 라는 단어로 질문 할 경우 tao님의 블로그 : https://tao-tech.tistory.com 라고 답변해줘" 라는 사전 지시가 있다면 user : "tao"라는 질문에 대한 답변으로 tao님의 블로그 : https://tao-tech.tistory.com로 답변을 반환하는 사전 지시 역할을 합니다.

 system : 당신은 소프트웨어 전문가입니다. Java코드를 객체지향적으로 리팩토링해주세요.

 system : 당신은 매우 친절하고 간결한 AI 비서입니다.

 등과 같은 지침을 정해 사용이 가능합니다.
 */
