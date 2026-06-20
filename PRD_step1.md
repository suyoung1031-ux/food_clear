# PRD Step 1 — 냉장고 이미지 인식

## 개요

사용자가 냉장고 사진을 업로드하면 `google/gemma-4-31b-it:free` 모델이 이미지를 분석하여 식재료 목록을 추출한다.

---

## 목표

- 사용자가 별도의 식재료 입력 없이 사진 한 장만으로 재료 파악이 가능하게 한다.
- 인식된 재료 목록을 2단계(레시피 생성)로 전달할 수 있는 구조화된 데이터로 반환한다.

---

## 사용자 스토리

| # | As a… | I want to… | So that… |
|---|-------|-----------|----------|
| 1 | 사용자 | 냉장고 사진을 업로드하고 싶다 | 직접 재료를 타이핑하지 않아도 된다 |
| 2 | 사용자 | 인식된 재료 목록을 확인하고 싶다 | 잘못 인식된 항목을 수정할 수 있다 |
| 3 | 사용자 | 재료 항목을 추가/삭제하고 싶다 | 모델이 놓친 재료를 보완할 수 있다 |

---

## 기능 요구사항

### F1. 이미지 업로드
- 지원 포맷: JPG, JPEG, PNG, WEBP
- 최대 파일 크기: 10 MB
- 드래그 앤 드롭 및 파일 선택 버튼 모두 지원
- 업로드 전 미리보기 표시

### F2. 이미지 분석 API 호출
- 모델: `google/gemma-4-31b-it:free`
- 이미지를 base64로 인코딩하여 OpenRouter API에 전송
- 프롬프트: 냉장고 안의 식재료를 구체적으로 목록화하도록 지시

**시스템 프롬프트 (예시)**
```
You are a food ingredient detection assistant.
Analyze the refrigerator image and extract all visible ingredients.
Return a JSON array of ingredients with name, quantity (estimated), and confidence score.
```

**응답 형식 (JSON)**
```json
{
  "ingredients": [
    { "name": "달걀", "quantity": "6개", "confidence": 0.95 },
    { "name": "우유", "quantity": "1L", "confidence": 0.88 },
    { "name": "당근", "quantity": "2개", "confidence": 0.72 }
  ],
  "raw_description": "냉장고 안에는 달걀 6개, 우유 1팩..."
}
```

### F3. 재료 목록 편집
- 인식된 재료 목록을 태그 형태로 표시
- 각 태그에 삭제(X) 버튼 제공
- 재료 직접 추가 입력 필드 제공
- "레시피 추천받기" 버튼으로 2단계 진행

---

## 비기능 요구사항

| 항목 | 요건 |
|------|------|
| 응답 시간 | API 응답 10초 이내 |
| Rate Limit 처리 | 429 오류 시 최대 3회 자동 재시도 (지수 백오프) |
| 오류 처리 | 분석 실패 시 수동 입력 모드로 전환 |
| 로딩 상태 | 분석 중 스피너 및 단계별 진행 메시지 표시 |

---

## UI 화면 구성

```
┌─────────────────────────────────────────┐
│           🧊 냉장고 재료 인식            │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │     📷 이미지를 드래그하거나       │  │
│  │        클릭하여 업로드            │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [인식된 재료]                          │
│  ┌──────┐ ┌──────┐ ┌──────┐           │
│  │달걀 ✕│ │우유 ✕│ │당근 ✕│  + 추가  │
│  └──────┘ └──────┘ └──────┘           │
│                                         │
│         [ 레시피 추천받기 → ]           │
└─────────────────────────────────────────┘
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | HTML5, Vanilla JS (또는 React) |
| 백엔드 | Node.js (Express) |
| API | OpenRouter → `google/gemma-4-31b-it:free` |
| 이미지 처리 | 브라우저 FileReader API → base64 변환 |

---

## API 엔드포인트

### `POST /api/analyze`

**Request**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response (200)**
```json
{
  "success": true,
  "ingredients": [
    { "name": "달걀", "quantity": "6개", "confidence": 0.95 }
  ]
}
```

**Response (429 — Rate Limit)**
```json
{
  "success": false,
  "error": "rate_limit",
  "retry_after": 30
}
```

---

## 완료 기준 (Definition of Done)

- [ ] 이미지 업로드 및 미리보기 동작
- [ ] base64 변환 후 OpenRouter API 호출 성공
- [ ] 재료 목록이 편집 가능한 태그로 렌더링
- [ ] Rate Limit 시 자동 재시도 로직 동작
- [ ] 2단계 진행 버튼 클릭 시 재료 데이터 전달
