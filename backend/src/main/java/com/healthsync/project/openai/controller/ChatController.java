package com.healthsync.project.openai.controller;

import com.healthsync.project.openai.dto.ChatRequest;
import com.healthsync.project.openai.dto.ChatResponse;
import com.healthsync.project.openai.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            Authentication auth,
            @Valid @RequestBody ChatRequest chatRequest) {

        // ✅ 데이터가 잘 들어오는지 확인하는 로그 추가
        log.info("===== ChatController에 요청 진입 =====");
        log.info("전달받은 메시지: {}", chatRequest.getMessage());

        if (chatRequest.getReportContext() != null) {
            log.info(">>> reportContext 객체가 존재합니다. <<<");
            log.info("전달받은 컨텍스트 닉네임: {}", chatRequest.getReportContext().getNickname());
            log.info("전달받은 컨텍스트 키: {}", chatRequest.getReportContext().getHeight());
        } else {
            log.error(">>> [문제 발생] 전달받은 reportContext가 null 입니다. <<<");
        }
        log.info("======================================");


        Long userId = getUserIdFromAuth(auth);

        String answer = chatService.getAnswer(userId, chatRequest);


//        String answer = chatService.getAnswer(userId, chatRequest.getMessage());
        return ResponseEntity.ok(ChatResponse.of(answer));
    }

    public Long getUserIdFromAuth(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            throw new IllegalStateException("인증 정보를 찾을 수 없습니다.");
        }
        String userIdStr = auth.getName();
        try {
            return Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            throw new IllegalStateException("인증 정보가 올바르지 않습니다 (ID가 숫자가 아님).");
        }
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
