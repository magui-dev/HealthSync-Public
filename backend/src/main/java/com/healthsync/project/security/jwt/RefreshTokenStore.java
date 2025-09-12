package com.healthsync.project.security.jwt;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RefreshTokenStore {

    // key: refreshToken, value: 만료시각(epoch seconds)
    private final Map<String, Long> store = new ConcurrentHashMap<>();

    /** 저장 */
    public void save(String refreshToken, long expEpochSeconds) {
        store.put(refreshToken, expEpochSeconds);
    }

    /** 존재 + 아직 유효한지 */
    public boolean exists(String refreshToken) {
        Long exp = store.get(refreshToken);
        return exp != null && exp > Instant.now().getEpochSecond();
    }

    /** 삭제 */
    public void delete(String refreshToken) {
        store.remove(refreshToken);
    }
}
