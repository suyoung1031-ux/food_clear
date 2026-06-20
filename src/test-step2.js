// Step 2 E2E 테스트 — /api/recipes 엔드포인트 검증
const BASE = "http://localhost:3000";

const testCases = [
  {
    label: "한국 가정식 (30분, 2인분)",
    body: {
      ingredients: ["달걀", "우유", "당근", "양파", "간장", "참기름"],
      options: { max_cook_time: 30, servings: 2, dietary: [] },
    },
  },
];

for (const tc of testCases) {
  console.log(`\n${"=".repeat(56)}`);
  console.log(`테스트: ${tc.label}`);
  console.log(`재료: ${tc.body.ingredients.join(", ")}`);
  console.log(`옵션: 조리시간 ${tc.body.options.max_cook_time}분, ${tc.body.options.servings}인분`);
  console.log("=".repeat(56));

  const res = await fetch(`${BASE}/api/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tc.body),
  });

  const data = await res.json();

  if (!data.success) {
    console.error("실패:", data.error);
    continue;
  }

  console.log(`캐시: ${data.cached ? "HIT" : "MISS"}\n`);

  data.recipes.forEach((r, i) => {
    console.log(`┌─ 레시피 ${i + 1}: ${r.name}`);
    console.log(`│  ${r.description}`);
    console.log(`│  ⏱ ${r.cook_time_minutes}분 | ${r.difficulty} | ${r.servings}인분`);
    console.log(`│  칼로리: ${r.nutrition?.calories}kcal | 단백질: ${r.nutrition?.protein}`);

    console.log("│  [재료]");
    r.ingredients.forEach((ing) => {
      const avail = ing.available ? "✓" : "✗";
      console.log(`│    ${avail} ${ing.name} (${ing.amount})`);
    });

    console.log("│  [조리 순서]");
    r.steps.forEach((s) => {
      console.log(`│    ${s.step}. ${s.description}`);
    });

    if (r.tips) console.log(`│  💡 팁: ${r.tips}`);
    console.log("└" + "─".repeat(54));
  });

  // 캐시 테스트 (동일 요청 재전송)
  console.log("\n[ 캐시 확인 — 동일 요청 재전송 ]");
  const res2 = await fetch(`${BASE}/api/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tc.body),
  });
  const data2 = await res2.json();
  console.log(`캐시: ${data2.cached ? "HIT ✓ (10분 캐시 정상 동작)" : "MISS (예상치 못한 결과)"}`);
}

console.log("\n모든 테스트 완료");
