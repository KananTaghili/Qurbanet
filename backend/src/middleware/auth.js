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

module.exports = authenticate;
