// 서버 /api/analyze 엔드포인트를 통해 모델 응답 품질 검증
import { OPENROUTER_API_KEY } from "./config.js";

// 이전에 동작 확인된 picsum 이미지 (seed=237)
const IMAGE_URL = "https://picsum.photos/seed/237/800/600";

const PROMPT = `이 냉장고 사진을 분석해서 보이는 모든 식재료를 추출해줘.

아래 JSON 형식으로만 응답해. 마크다운, 설명, 코드블록 없이 순수 JSON만 출력해:
{
  "ingredients": [
    { "name": "재료명(한국어)", "quantity": "예상 수량(예: 3개, 1팩, 약간)", "confidence": 0.95 }
  ],
  "raw_description": "냉장고 안 전체에 대한 한국어 한 줄 설명"
}

주의:
- 보이는 식재료를 빠짐없이 추출할 것
- 이름은 반드시 한국어로 작성
- confidence는 0.0~1.0 사이 숫자
- JSON 이외의 어떤 텍스트도 출력하지 말 것`;

console.log("이미지 다운로드 중...");
const imgRes = await fetch(IMAGE_URL, {
  headers: { "User-Agent": "Mozilla/5.0 (Study-04 Test)" },
});
if (!imgRes.ok) throw new Error(`이미지 다운로드 실패: ${imgRes.status}`);
const buf = await imgRes.arrayBuffer();
const base64 = Buffer.from(buf).toString("base64");
console.log(`이미지 준비: ${(buf.byteLength / 1024).toFixed(0)} KB\n`);

async function callWithRetry(retryCount = 0) {
  console.log(`API 호출 중... (시도 ${retryCount + 1})`);
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemma-4-31b-it:free",
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    }),
  });

  if (res.status === 429) {
    const wait = Math.max(30, parseInt(res.headers.get("retry-after") || "30")) + retryCount * 15;
    console.log(`  429 — ${wait}초 대기...`);
    await new Promise(r => setTimeout(r, wait * 1000));
    return callWithRetry(retryCount + 1);
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

const data = await callWithRetry();
const raw = data.choices[0].message.content;

console.log("\n=== 모델 원본 응답 ===");
console.log(raw);

// JSON 파싱 테스트
let s = raw.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/m, "").trim();
const m = s.match(/\{[\s\S]*\}/);
if (m) s = m[0];

console.log("\n=== JSON 파싱 결과 ===");
try {
  const parsed = JSON.parse(s);
  console.log(`재료 ${parsed.ingredients.length}개 인식:`);
  parsed.ingredients.forEach((i, idx) => {
    const pct = Math.round((i.confidence || 0.5) * 100);
    const bar = "█".repeat(Math.round(pct / 10));
    console.log(`  ${idx + 1}. ${String(i.name).padEnd(12)} | ${String(i.quantity).padEnd(8)} | ${bar} ${pct}%`);
  });
  if (parsed.raw_description) console.log("\n설명:", parsed.raw_description);
  console.log("\n✓ JSON 파싱 성공 — 개선된 프롬프트 정상 동작");
} catch (e) {
  console.log("✗ JSON 파싱 실패:", e.message);
}

console.log(`\n토큰 사용: ${data.usage?.total_tokens ?? "N/A"}`);
