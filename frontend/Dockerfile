#================================
# 1단계 : 빌드 스테이지
#================================
FROM node:22-slim AS builder

WORKDIR /app

# 패키지 파일 복사 (캐싱용)
COPY package.json package-lock.json ./

# 의존성 설치
RUN npm ci

# 소스코드 복사 후 빌드
COPY . .
RUN npm run build

#================================
# 2단계 : 실행 스테이지 (Nginx)
#================================
FROM nginx:stable

#빌드된 파일 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 노출
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
