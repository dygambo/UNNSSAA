const { z } = require("zod");
const authService = require("./auth.service");

const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

async function register(req, res, next) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await authService.register(payload);

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await authService.login(payload);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const payload = refreshSchema.parse(req.body);
    const result = await authService.refreshAccessToken(payload.refreshToken);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const payload = refreshSchema.parse(req.body);
    await authService.logout(payload.refreshToken);

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout
};
