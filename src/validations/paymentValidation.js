const { z } = require("zod");

const createPaymentSchema = z.object({
  bookingId: z.number().int().positive("Invalid booking ID"),
});

module.exports = {
  createPaymentSchema,
};