import { OPENROUTER_API_KEY } from "./config.js";

// 냉장고 내용물이 있는 테스트 이미지 (Unsplash 오픈소스)
const TEST_IMAGE_URL =
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80";

const MODEL = "google/gemma-4-31b-it:free";
const MAX_RETRIES = 5;

console.log("=== Step 1 엔드투엔드 테스트 ===\n");
console.log("이미지 다운로드 중...");

const imgRes = await fetch(TEST_IMAGE_URL);
if (!imgRes.ok) throw new Error(`이미지 다운로드 실패: ${imgRes.status}`);
const imgBuffer = await imgRes.arrayBuffer();
const base64 = Buffer.from(imgBuffer).toString("base64");
const mimeType = "image/jpeg";
console.log(`이미지 준비 완료 (${(imgBuffer.byteLength / 1024).toFixed(1)} KB)\n`);

async function callWithRetry(retryCount = 0) {
  console.log(`API 호출 중... (시도 ${retryCount + 1}/${MAX_RETRIES + 1})`);

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            {
              type: "text",
              text: `이 냉장고 사진에서 보이는 모든 식재료를 한국어로 추출해줘.
반드시 아래 JSON 형식으로만 응답해. 다른 텍스트는 포함하지 마.
{
  "ingredients": [
    { "name": "재료명", "quantity": "예상 수량", "confidence": 0.9 }
  ],
  "raw_description": "냉장고 전체 설명"
}`,
            },
          ],
        },
      ],
    }),
  });

  if (res.status === 429) {
    if (retryCount >= MAX_RETRIES) throw new Error("Rate limit 최대 재시도 초과");
    const retryAfter = parseInt(res.headers.get("retry-after") || "30", 10);
    const waitSec = Math.max(retryAfter, 30) + retryCount * 10;
    console.log(`  → Rate limit (429). ${waitSec}초 후 재시도...`);
    await new Promise((r) => setTimeout(r, waitSec * 1000));
    return callWithRetry(retryCount + 1);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
}

const data = await callWithRetry();
const content = data.choices[0].message.content;
console.log("\n--- 모델 원본 응답 ---");
console.log(content);

// JSON 파싱 시도
let parsed = null;
try {
  const jsonMatch =
    content.match(/```json\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);
  parsed = JSON.parse(jsonMatch ? jsonMatch[1].trim() : content.trim());
} catch {
  console.log("\n(JSON 파싱 실패 — 원문 표시)");
}

if (parsed?.ingredients) {
  console.log("\n--- 인식된 재료 목록 ---");
  parsed.ingredients.forEach((item, i) => {
    const bar = "█".repeat(Math.round(item.confidence * 10));
    console.log(
      `  ${i + 1}. ${item.name.padEnd(10)} | ${item.quantity.padEnd(8)} | 신뢰도: ${bar} ${(item.confidence * 100).toFixed(0)}%`
    );
  });

  if (parsed.raw_description) {
    console.log("\n--- AI 설명 ---");
    console.log(parsed.raw_description);
  }

  console.log(`\n총 ${parsed.ingredients.length}개 재료 인식 완료`);
}

console.log(`\n토큰 사용: ${data.usage?.total_tokens ?? "N/A"}`);
