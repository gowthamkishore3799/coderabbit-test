const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const jwt = require("jsonwebtoken");
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: "Token expired or invalid" });
  }
}

module.exports = { authenticate };
