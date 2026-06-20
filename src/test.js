import { OPENROUTER_API_KEY } from "./config.js";

const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "openai/gpt-4o-mini",
    messages: [{ role: "user", content: "Say 'API test successful!' in Korean." }],
  }),
});

if (!response.ok) {
  const error = await response.text();
  throw new Error(`HTTP ${response.status}: ${error}`);
}

const data = await response.json();
console.log("✓ API 연결 성공");
console.log("모델:", data.model);
console.log("응답:", data.choices[0].message.content);
console.log("토큰 사용량:", data.usage);
