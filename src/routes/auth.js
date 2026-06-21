import crypto from "crypto";

const users = new Map();   // email -> { email, name, passwordHash, salt }
const sessions = new Map(); // token -> { email, name }

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key.toString("hex"));
    });
  });
}

export async function signup(req, res) {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ success: false, error: "모든 항목을 입력해주세요." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: "올바른 이메일 형식이 아닙니다." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "비밀번호는 6자 이상이어야 합니다." });
    }
    if (users.has(email)) {
      return res.status(409).json({ success: false, error: "이미 사용 중인 이메일입니다." });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = await hashPassword(password, salt);
    users.set(email, { email, name, passwordHash, salt });

    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, { email, name });

    res.json({ success: true, token, user: { email, name } });
  } catch (err) {
    console.error("[auth] signup error:", err.message);
    res.status(500).json({ success: false, error: "회원가입에 실패했습니다." });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "이메일과 비밀번호를 입력해주세요." });
    }

    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const hash = await hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      return res.status(401).json({ success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, { email: user.email, name: user.name });

    res.json({ success: true, token, user: { email: user.email, name: user.name } });
  } catch (err) {
    console.error("[auth] login error:", err.message);
    res.status(500).json({ success: false, error: "로그인에 실패했습니다." });
  }
}

export function logout(req, res) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    sessions.delete(auth.slice(7));
  }
  res.json({ success: true });
}

// API 라우트 보호용 인증 미들웨어
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "인증이 필요합니다." });
  }
  const token = auth.slice(7);
  const session = sessions.get(token);
  if (!session) {
    return res.status(401).json({ success: false, error: "유효하지 않은 세션입니다." });
  }
  req.user = session;
  next();
}
