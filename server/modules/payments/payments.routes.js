const crypto = require("crypto");
const { Router } = require("express");
const { z } = require("zod");

const prisma = require("../../config/prisma");
const { env } = require("../../config/env");

const router = Router();

const initSchema = z.object({
  email: z.string().email(),
  amount: z.coerce.number().positive(),
  donorName: z.string().min(2).max(120),
  classYear: z.string().max(20).optional(),
  details: z.string().max(500).optional(),
  callbackUrl: z.string().url().optional()
});

function hasPaystackConfig() {
  return Boolean(env.paystackSecretKey);
}

async function markDonationFromReference(reference, fallbackData) {
  if (!reference) return null;

  const paidAt = fallbackData && fallbackData.paid_at ? new Date(fallbackData.paid_at) : new Date();
  await prisma.donation.updateMany({
    where: { transactionRef: reference },
    data: {
      status: "ACTIVE",
      donatedAt: paidAt
    }
  });

  return prisma.donation.findFirst({
    where: { transactionRef: reference }
  });
}

router.post("/initialize", async (req, res, next) => {
  try {
    if (!hasPaystackConfig()) {
      return res.status(503).json({
        success: false,
        message: "Payment gateway is not configured"
      });
    }

    const payload = initSchema.parse(req.body);
    const amountKobo = Math.round(payload.amount * 100);

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.paystackSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: payload.email,
        amount: amountKobo,
        metadata: {
          donorName: payload.donorName,
          classYear: payload.classYear || "",
          details: payload.details || ""
        },
        callback_url: payload.callbackUrl
      })
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.status(400).json({
        success: false,
        message: data.message || "Unable to initialize payment"
      });
    }

    await prisma.donation.create({
      data: {
        donorName: payload.donorName,
        classYear: payload.classYear,
        amount: payload.amount,
        details: payload.details,
        currency: "NGN",
        status: "PENDING",
        transactionRef: data.data.reference
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        authorizationUrl: data.data.authorization_url,
        reference: data.data.reference,
        accessCode: data.data.access_code
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/webhook/paystack", async (req, res, next) => {
  try {
    if (!env.paystackWebhookSecret) {
      return res.status(503).json({
        success: false,
        message: "Webhook secret is not configured"
      });
    }

    const signature = req.headers["x-paystack-signature"];
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : JSON.stringify(req.body || {});
    const expected = crypto.createHmac("sha512", env.paystackWebhookSecret).update(rawBody).digest("hex");

    if (!signature || signature !== expected) {
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }

    const event = Buffer.isBuffer(req.body) ? JSON.parse(rawBody) : req.body;
    if (event && event.event === "charge.success" && event.data && event.data.reference) {
      await markDonationFromReference(event.data.reference, event.data);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/verify/:reference", async (req, res, next) => {
  try {
    if (!hasPaystackConfig()) {
      return res.status(503).json({
        success: false,
        message: "Payment gateway is not configured"
      });
    }

    const reference = String(req.params.reference || "").trim();
    if (!reference) {
      return res.status(400).json({ success: false, message: "Transaction reference is required" });
    }

    const response = await fetch("https://api.paystack.co/transaction/verify/" + encodeURIComponent(reference), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.paystackSecretKey}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      return res.status(400).json({
        success: false,
        message: data.message || "Unable to verify transaction"
      });
    }

    const verifiedData = data.data || {};
    if (verifiedData.status === "success") {
      await markDonationFromReference(reference, verifiedData);
    }

    const donation = await prisma.donation.findFirst({
      where: { transactionRef: reference }
    });

    return res.status(200).json({
      success: true,
      data: {
        reference,
        gatewayStatus: verifiedData.status || "unknown",
        amountKobo: verifiedData.amount || 0,
        paidAt: verifiedData.paid_at || null,
        channel: verifiedData.channel || null,
        currency: verifiedData.currency || "NGN",
        donorEmail: verifiedData.customer && verifiedData.customer.email ? verifiedData.customer.email : null,
        donorName:
          (verifiedData.metadata && verifiedData.metadata.donorName) ||
          (donation && donation.donorName) ||
          null,
        donation
      }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
