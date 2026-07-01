const jwt = require("jsonwebtoken");
const { error } = require("../utils/response");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return error(res, "Token təqdim edilməyib. Giriş edin.", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.phone = decoded.phone;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return error(res, "Sessiyanın müddəti bitib. Yenidən giriş edin.", 401);
    }
    return error(res, "Yanlış token. Giriş edin.", 401);
  }
};

// Token varsa userId-ni set edir, yoxdursa req.userId = null ilə davam edir
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.userId = null;
    return next();
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.phone  = decoded.phone;
  } catch (_) {
    req.userId = null;
  }
  next();
};

module.exports = authenticate;
module.exports.authenticate  = authenticate;
module.exports.optionalAuth  = optionalAuth;
