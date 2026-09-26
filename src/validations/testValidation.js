const { z } = require("zod");

const createTestSchema = z.object({
  centreId: z.number().int().positive(),
  name: z
    .string()
    .min(2, "Test name must be at least 2 characters")
    .max(150, "Test name must be less than 150 characters"),
  price: z.number().positive("Price must be greater than 0"),
});

module.exports = {
  createTestSchema,
};