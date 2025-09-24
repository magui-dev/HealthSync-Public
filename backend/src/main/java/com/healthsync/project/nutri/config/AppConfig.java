package com.healthsync.project.nutri.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.HttpURLConnection;

@Configuration
@EnableConfigurationProperties(DataGoKrProps.class)
public class AppConfig {


    static class NoRedirectRequestFactory extends SimpleClientHttpRequestFactory {
        @Override
        protected void prepareConnection(HttpURLConnection connection, String httpMethod) throws IOException {
            super.prepareConnection(connection, httpMethod);
            connection.setInstanceFollowRedirects(false); // ★ 리다이렉트 자동 추종 금지
        }
    }

    @Bean
    public RestTemplate restTemplateNoRedirect() {
        ClientHttpRequestFactory f = new NoRedirectRequestFactory();
        if (f instanceof SimpleClientHttpRequestFactory s) {
            s.setConnectTimeout(5_000);
            s.setReadTimeout(100_000);
        }
        return new RestTemplate(f);
    }

}
