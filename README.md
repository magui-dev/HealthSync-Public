# 🏥 HealthSync

> AI 기반 개인 맞춤형 건강관리 플랫폼

[![배포 사이트](https://img.shields.io/badge/🌐_배포_사이트-healthsync.magui-dev.com-blue?style=for-the-badge)](https://healthsync.magui-dev.com)

---

## 📖 프로젝트 소개

**HealthSync**는 사용자의 건강 목표 달성을 돕는 통합 헬스케어 플랫폼입니다.

- 📊 **TDEE 기반 과학적 칼로리 계산**
- 🍎 **공공데이터 포털 연동 (10만+ 식품 영양정보)**
- 🤖 **OpenAI GPT-4o-mini 기반 AI 건강 상담**
- 👥 **커뮤니티 게시판으로 정보 공유**

### 개발 정보
- **기간**: 2024.09 - 2024.10 (1.5개월)
- **인원**: 4인

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🔐 **소셜 로그인** | OAuth2 (Google, Kakao, Naver) + JWT 인증 |
| 👤 **프로필 관리** | BMI, TDEE 자동 계산 및 시각화 |
| 🎯 **목표 설정** | 감량/증량 목표별 맞춤 식단 계획 (1-24주) |
| 🔍 **식품 검색** | 공공데이터 포털 API로 실시간 영양정보 조회 |
| 📈 **진행도 추적** | 주간 리포트 및 체중 변화 그래프 |
| 💬 **AI 상담** | 사용자 프로필 기반 맞춤 건강 조언 |
| 📝 **커뮤니티** | 게시판, 좋아요, 댓글, 태그, 북마크 |

---

## 🛠 기술 스택

### Backend
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.0.1-6DB33F?logo=springboot&logoColor=white)
![Java](https://img.shields.io/badge/Java-17-007396?logo=openjdk&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7.1.2-646CFF?logo=vite&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.11.0-5A29E4?logo=axios&logoColor=white)

### Infrastructure
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white)
![AWS EC2](https://img.shields.io/badge/AWS_EC2-FF9900?logo=amazonec2&logoColor=white)

### External APIs
- **OAuth2**: Google, Kakao, Naver
- **OpenAI**: GPT-4o-mini
- **공공데이터 포털**: 식품영양정보 API

---

## 🏗 아키텍처

```
┌─────────────┐
│   Browser   │ (React SPA)
└──────┬──────┘
       │ HTTPS
┌──────▼──────────────────────┐
│      AWS EC2 (Ubuntu)        │
│  ┌────────────────────────┐ │
│  │  Nginx (Reverse Proxy) │ │
│  └─────┬──────────┬────────┘ │
│        │          │           │
│  ┌─────▼────┐ ┌──▼────────┐ │
│  │ Frontend │ │  Backend  │ │
│  │ (Nginx)  │ │ (Spring)  │ │
│  └──────────┘ └──┬────────┘ │
│                  │           │
│              ┌───▼────┐      │
│              │ MySQL  │      │
│              └────────┘      │
└──────────────────────────────┘
```

---

## 🚀 로컬 실행

### 사전 요구사항
- Java 17+
- Node.js 18+
- MySQL 8.0+

### 실행 방법

```bash
# Backend
cd backend
./gradlew bootRun

# Frontend
cd frontend
npm install
npm run dev
```

**접속**: http://localhost:5173

---

## 🎯 핵심 기능 설명

### 1. 식단 계획 알고리즘
- **TDEE 계산**: BMR(기초대사량) × 활동계수
- **일일 칼로리 증감**: 목표 달성을 위한 과학적 계산
- **안전 장치**: 과도한 증감 방지 (±20%) + 최소 칼로리 보장

### 2. AI 건강 상담
- 사용자 프로필 & 목표 기반 맞춤 답변
- 대화 히스토리 유지 (최근 10개)
- 리포트 데이터 실시간 반영

### 3. 공공데이터 API 통합
- 4종 API 순차 검색 (승인식품 → 식품 → 가공식품 → 원재료)
- 평균 응답 시간: 200-500ms
- 10만+ 식품 영양정보 제공

---

## 📝 주요 트러블슈팅

### 1. API 경로 통일
**문제**: 프론트엔드 `/profile/edit`, Nginx `/api/` 만 프록시  
**해결**: 모든 API 경로를 `/api/` prefix로 통일

### 2. Nginx Trailing Slash
**문제**: `POST /posts` 요청이 404  
**해결**: `location /posts/` → `location /posts` (slash 제거)

### 3. Docker 디스크 공간
**해결**: `docker system prune -a --volumes`로 정리

---

## 📞 Contact

- **GitHub**: [@jinmo-kim-korean](https://github.com/jinmo-kim-korean)
- **Email**: jinmo.kim.korean@gmail.com
- **배포 사이트**: https://healthsync.magui-dev.com

---

<div align="center">


**Made with ❤️ by JinMo Kim**

</div>
