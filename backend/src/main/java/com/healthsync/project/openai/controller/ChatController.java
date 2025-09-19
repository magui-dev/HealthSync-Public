package com.healthsync.project.openai.controller;

import com.healthsync.project.openai.dto.ChatRequest;
import com.healthsync.project.openai.dto.ChatResponse;
import com.healthsync.project.openai.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest chatRequest) {
        String answer = chatService.getAnswer(chatRequest.getMessage());

        return ResponseEntity.ok(ChatResponse.of(answer));
    }

    @PostMapping("/_ping")
    public ResponseEntity<ChatResponse> ping() {
        String must = "정확히 이 문자열만 출력: PING-12345";
        String answer = chatService.getAnswer(must);
        return ResponseEntity.ok(ChatResponse.of(answer));
    }


}



//@RestController
//@RequestMapping("/api/chat")
//public class ChatController {
//    private final ChatService chatService;
//
//    public ChatController(ChatService chatService) {
//        this.chatService = chatService;
//    }
//
//    // GET 방식 요청 (로그인 필수)
//    @GetMapping
//    public String chat(@RequestParam String prompt,
//                       @AuthenticationPrincipal UserDetails user) {
//        if (user == null) {
//            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 필요");
//        }
//
//        try {
//            return chatService.askGPT(prompt);
//        } catch (Exception e) {
//            e.printStackTrace();
//            return "⚠️ AI 호출 실패: " + e.getMessage();
//        }
//    }
//
//    // POST 방식 요청 (로그인 필수, JSON body 전달)
//    @PostMapping
//    public String chatPost(@RequestBody String prompt,
//                           @AuthenticationPrincipal UserDetails user) {
//        if (user == null) {
//            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 필요");
//        }
//
//        try {
//            return chatService.askGPT(prompt);
//        } catch (Exception e) {
//            e.printStackTrace();
//            return "⚠️ AI 호출 실패: " + e.getMessage();
//        }
//    }
//}
