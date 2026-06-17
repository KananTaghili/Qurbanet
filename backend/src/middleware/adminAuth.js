const jwt = require("jsonwebtoken");
const { error } = require("../utils/response");

const SECRETS = [
  process.env.ADMIN_JWT_SECRET,
  "qurbanet_admin_proxy_secret_2026",
  "admin_sacrifice_super_secret_2025_change_in_production",
].filter(Boolean);

const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) return error(res, "Token tələb olunur.", 401);

  for (const secret of SECRETS) {
    try {
      const decoded = jwt.verify(token, secret);
      req.adminUsername = decoded.email || "admin";
      req.adminEmail = decoded.email || "admin";
      return next();
    } catch {}
  }

  return error(res, "Yanlış admin token.", 401);
};

module.exports = adminAuth;
