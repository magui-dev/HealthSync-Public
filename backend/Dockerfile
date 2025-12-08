# ====================================
# 1단계 : 빌드 스테이지
# ====================================
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /app

# Gradle Wrapper 복사
COPY gradlew ./
COPY gradle ./gradle

# 실행 권한 부여
RUN chmod +x gradlew

# Gradle 설정 파일 복사
COPY build.gradle settings.gradle ./

# 의존성 미리 다운로드
RUN ./gradlew dependencies --no-daemon || true

# 소스코드 복사 후 빌드
COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# ====================================
# 2단계 : 실행 스테이지
# ====================================
FROM eclipse-temurin:17-jre

WORKDIR /app

# 빌드된 JAR만 복사
COPY --from=builder /app/build/libs/*.jar app.jar

# 포트 노출
EXPOSE 8080

# 실행
ENTRYPOINT ["java", "-jar", "app.jar"]

