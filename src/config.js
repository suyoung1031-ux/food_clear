import "dotenv/config";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY가 .env 파일에 설정되지 않았습니다.");
}

export { OPENROUTER_API_KEY };
