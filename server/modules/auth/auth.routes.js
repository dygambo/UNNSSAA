const { Router } = require("express");
const authController = require("./auth.controller");
const { authenticate } = require("../../middlewares/auth");

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

router.get("/me", authenticate, (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

module.exports = router;
