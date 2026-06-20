import "dotenv/config";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { analyzeImage } from "./routes/analyze.js";
import { generateRecipes } from "./routes/recipes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));
app.use(express.static(join(__dirname, "../public")));

app.post("/api/analyze", analyzeImage);
app.post("/api/recipes", generateRecipes);

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
