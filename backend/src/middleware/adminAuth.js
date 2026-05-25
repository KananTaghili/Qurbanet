const jwt = require("jsonwebtoken");
const { error } = require("../utils/response");

const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return error(res, "Admin token təqdim edilməyib.", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (decoded.role !== "admin") {
      return error(res, "Admin icazəsi yoxdur.", 403);
    }
    req.adminUsername = decoded.username || decoded.email;
    req.adminEmail = decoded.email;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return error(res, "Admin sessiyasının müddəti bitib.", 401);
    }
    return error(res, "Yanlış admin token.", 401);
  }
};

module.exports = adminAuth;
