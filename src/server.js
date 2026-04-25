const http = require("http");
const app = require("./app");
const prisma = require("./config/prisma");
const logger = require("./config/logger");
const { env, validateEnv } = require("./config/env");

async function bootstrap() {
  validateEnv();

  const server = http.createServer(app);

  server.listen(env.port, () => {
    logger.info(`UNNSSAA server listening on port ${env.port}`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown.`);

    server.close(async () => {
      await prisma.$disconnect();
      logger.info("HTTP server closed and Prisma disconnected.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch(async (error) => {
  logger.error({ err: error }, "Failed to start server");
  await prisma.$disconnect();
  process.exit(1);
});
