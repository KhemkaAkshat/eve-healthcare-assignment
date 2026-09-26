const { z } = require("zod");

const createBookingSchema = z.object({
  testId: z.number().int().positive("Invalid test ID"),
  centreId: z.number().int().positive("Invalid centre ID"),
  appointmentAt: z.string().datetime("Invalid appointment date and time"),
});

module.exports = {
  createBookingSchema,
};