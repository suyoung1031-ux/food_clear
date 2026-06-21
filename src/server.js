import "dotenv/config";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { analyzeImage } from "./routes/analyze.js";
import { generateRecipes } from "./routes/recipes.js";
import { signup, login, logout, requireAuth } from "./routes/auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json({ limit: "20mb" }));
app.use(express.static(join(__dirname, "../public")));

app.post("/api/auth/signup", signup);
app.post("/api/auth/login", login);
app.post("/api/auth/logout", logout);

app.post("/api/analyze", requireAuth, analyzeImage);
app.post("/api/recipes", requireAuth, generateRecipes);

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
