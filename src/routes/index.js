const { Router } = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const contentRoutes = require("../modules/content/content.routes");
const paymentRoutes = require("../modules/payments/payments.routes");

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

router.use("/auth", authRoutes);
router.use("/content", contentRoutes);
router.use("/payments", paymentRoutes);

module.exports = router;
