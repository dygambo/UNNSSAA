const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { env } = require("../config/env");

function unauthorized(message) {
  const error = new Error(message || "Unauthorized");
  error.statusCode = 401;
  return error;
}

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      throw unauthorized("Bearer token is required");
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, env.jwtAccessSecret);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      throw unauthorized("Account is inactive or does not exist");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error.statusCode ? error : unauthorized("Invalid or expired access token"));
  }
}

function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return next(unauthorized("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      const error = new Error("Forbidden");
      error.statusCode = 403;
      return next(error);
    }

    return next();
  };
}

module.exports = {
  authenticate,
  requireRole
};
