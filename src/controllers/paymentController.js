const {
  Payment,
  Booking,
  WebhookEvent,
} = require("../models");

const {
  createPaymentSchema,
  webhookSchema,
} = require("../validations/paymentValidation");

const sequelize = require("../config/database");

const crypto = require("crypto");

const createPayment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // 1. Validate request body
    const validationResult = createPaymentSchema.safeParse(req.body);

    if (!validationResult.success) {
      await transaction.rollback();

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
      transaction,
    });

    if (!booking) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 4. Check if payment already exists
    const existingPayment = await Payment.findOne({
      where: {
        bookingId,
      },
      transaction,
    });

    if (existingPayment) {
      await transaction.rollback();

      return res.status(409).json({
        success: false,
        message: "Payment already exists for this booking",
        data: existingPayment,
      });
    }

    // 5. Booking must be pending
    if (booking.status !== "PENDING") {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: `Payment cannot be processed for a ${booking.status} booking`,
      });
    }

    // 6. Generate payment reference
    const paymentReference = `PAY_${crypto.randomUUID()}`;

    // 7. Simulate payment
    const paymentStatus =
      Math.random() < 0.8 ? "SUCCESS" : "FAILED";

    // 8. Create payment inside transaction
    const payment = await Payment.create(
      {
        bookingId,
        paymentReference,
        amount: booking.amount,
        status: paymentStatus,
      },
      { transaction }
    );

    // 9. Update booking inside same transaction
    booking.status =
      paymentStatus === "SUCCESS"
        ? "CONFIRMED"
        : "FAILED";

    await booking.save({ transaction });

    // 10. Commit transaction
    await transaction.commit();

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
    // Rollback everything if anything fails
    await transaction.rollback();

    console.error("Create payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const handlePaymentWebhook = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // 1. Validate webhook payload
    const validationResult = webhookSchema.safeParse(req.body);

    if (!validationResult.success) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.issues,
      });
    }

    const {
      eventId,
      paymentReference,
      status,
    } = validationResult.data;

    // 2. Check whether this webhook event was already processed
    const existingEvent = await WebhookEvent.findOne({
      where: {
        eventId,
      },
      transaction,
    });

    if (existingEvent) {
      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: "Webhook event already processed",
      });
    }

    // 3. Find the payment
    const payment = await Payment.findOne({
      where: {
        paymentReference,
      },
      transaction,
    });

    if (!payment) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // 4. Make sure webhook status matches payment
    if (payment.status !== status) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Webhook status does not match payment status",
      });
    }

    // 5. Find the associated booking
    const booking = await Booking.findByPk(payment.bookingId, {
      transaction,
    });

    if (!booking) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 6. Update booking based on payment result
    booking.status =
      status === "SUCCESS"
        ? "CONFIRMED"
        : "FAILED";

    await booking.save({ transaction });

    // 7. Record webhook event
    await WebhookEvent.create(
      {
        eventId,
        paymentReference,
        status,
      },
      { transaction }
    );

    // 8. Commit all changes together
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Payment webhook processed successfully",
      data: {
        payment,
        booking,
      },
    });
  } catch (error) {
    // Rollback if anything failed
    await transaction.rollback();

    console.error("Payment webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
module.exports = {
  createPayment,
  handlePaymentWebhook
};