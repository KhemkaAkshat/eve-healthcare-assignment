const { z } = require("zod");

const createPaymentSchema = z.object({
  bookingId: z.number().int().positive("Invalid booking ID"),
});

const webhookSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  paymentReference: z.string().min(1, "Payment reference is required"),
  status: z.enum(["SUCCESS", "FAILED"]),
});

module.exports = {
  createPaymentSchema,
  webhookSchema,
};