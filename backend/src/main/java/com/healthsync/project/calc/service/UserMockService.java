package com.healthsync.project.calc.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.healthsync.project.calc.dto.TestUser;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;

@Service
public class UserMockService {

    private final List<TestUser> users;

    public UserMockService() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        try (InputStream is = getClass().getResourceAsStream("/mock_data.json")) {
            this.users = mapper.readValue(is, new TypeReference<List<TestUser>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Mock 데이터 로드 실패", e);
        }
    }

    public List<TestUser> getAllUsers() {
        return users;
    }

}

