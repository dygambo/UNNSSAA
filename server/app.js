const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const routes = require("./routes");
const errorHandler = require("./middlewares/error-handler");
const notFound = require("./middlewares/not-found");
const { env } = require("./config/env");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin.split(",").map((item) => item.trim()),
    credentials: true
  })
);
app.use("/api/payments/webhook/paystack", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.nodeEnv === "production" ? 300 : 500
  })
);

app.use(express.static(path.resolve(process.cwd())));
app.use("/api", routes);

app.get("/", (req, res) => {
  res.sendFile(path.resolve(process.cwd(), "index.html"));
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
