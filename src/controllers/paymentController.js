const {
  Payment,
  Booking,
  DiagnosticTest,
  DiagnosticCentre,
} = require("../models");

const {
  createPaymentSchema,
} = require("../validations/paymentValidation");

const crypto = require("crypto");

const createPayment = async (req, res) => {
  try {
    // 1. Validate request body
    const validationResult = createPaymentSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.issues,
      });
    }

    const { bookingId } = validationResult.data;

    // 2. Get authenticated user
    const userId = req.user.id;

    // 3. Find booking belonging to current user
    const booking = await Booking.findOne({
      where: {
        id: bookingId,
        userId,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 4. Booking must be pending
    if (booking.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Payment cannot be processed for a ${booking.status} booking`,
      });
    }

    // 5. Check if payment already exists
    const existingPayment = await Payment.findOne({
      where: {
        bookingId,
      },
    });

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message: "Payment already exists for this booking",
        data: existingPayment,
      });
    }

    // 6. Generate unique payment reference
    const paymentReference = `PAY_${crypto.randomUUID()}`;

    // 7. Simulate payment result
    const paymentStatus = Math.random() < 0.8
      ? "SUCCESS"
      : "FAILED";

    // 8. Create payment
    const payment = await Payment.create({
      bookingId,
      paymentReference,
      amount: booking.amount,
      status: paymentStatus,
    });

    // 9. Update booking based on payment result
    booking.status =
      paymentStatus === "SUCCESS"
        ? "CONFIRMED"
        : "FAILED";

    await booking.save();

    return res.status(201).json({
      success: true,
      message:
        paymentStatus === "SUCCESS"
          ? "Payment successful"
          : "Payment failed",
      data: {
        payment,
        booking,
      },
    });
  } catch (error) {
    console.error("Create payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createPayment,
};