const express = require("express");

const {
  createPayment, handlePaymentWebhook
} = require("../controllers/paymentController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createPayment);
router.post("/webhook", handlePaymentWebhook);

module.exports = router;