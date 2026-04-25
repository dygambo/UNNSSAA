const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const prisma = require("../../config/prisma");
const { env } = require("../../config/env");

function makeAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email
    },
    env.jwtAccessSecret,
    { expiresIn: env.accessTokenTtl }
  );
}

function makeRefreshToken(user) {
  const jti = randomUUID();

  const token = jwt.sign(
    {
      sub: user.id,
      jti
    },
    env.jwtRefreshSecret,
    { expiresIn: env.refreshTokenTtl }
  );

  return { token, jti };
}

async function register({ fullName, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role: "MEMBER"
    }
  });

  const accessToken = makeAccessToken(user);
  const refresh = makeRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenId: refresh.jti,
      expiresAt: new Date(jwt.decode(refresh.token).exp * 1000)
    }
  });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    },
    accessToken,
    refreshToken: refresh.token
  };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const accessToken = makeAccessToken(user);
  const refresh = makeRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenId: refresh.jti,
      expiresAt: new Date(jwt.decode(refresh.token).exp * 1000)
    }
  });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    },
    accessToken,
    refreshToken: refresh.token
  };
}

async function refreshAccessToken(refreshToken) {
  let payload;

  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch {
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    throw error;
  }

  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { tokenId: payload.jti },
    include: { user: true }
  });

  if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
    const error = new Error("Refresh token is no longer valid");
    error.statusCode = 401;
    throw error;
  }

  if (!tokenRecord.user || !tokenRecord.user.isActive) {
    const error = new Error("User account is inactive");
    error.statusCode = 401;
    throw error;
  }

  const accessToken = makeAccessToken(tokenRecord.user);

  return { accessToken };
}

async function logout(refreshToken) {
  try {
    const payload = jwt.verify(refreshToken, env.jwtRefreshSecret);

    await prisma.refreshToken.update({
      where: { tokenId: payload.jti },
      data: { revokedAt: new Date() }
    });
  } catch {
    return;
  }
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout
};
