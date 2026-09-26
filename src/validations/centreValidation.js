const { z } = require("zod");

const createCentreSchema = z.object({
  name: z
    .string()
    .min(2, "Centre name must be at least 2 characters")
    .max(150, "Centre name must be less than 150 characters"),

  location: z
    .string()
    .min(2, "Location must be at least 2 characters")
    .max(255, "Location must be less than 255 characters"),
});

module.exports = {
  createCentreSchema,
};