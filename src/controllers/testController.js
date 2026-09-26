const { DiagnosticTest, DiagnosticCentre } = require("../models");
const { createTestSchema } = require("../validations/testValidation");

const createTest = async (req, res) => {
  try {
    const validationResult = createTestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.issues,
      });
    }

    const { centreId, name, price } = validationResult.data;

    const centre = await DiagnosticCentre.findByPk(centreId);

    if (!centre) {
      return res.status(404).json({
        success: false,
        message: "Diagnostic centre not found",
      });
    }

    const test = await DiagnosticTest.create({
      centreId,
      name,
      price,
    });

    return res.status(201).json({
      success: true,
      message: "Diagnostic test created successfully",
      data: test,
    });
  } catch (error) {
    console.error("Create test error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getTests = async (req, res) => {
  try {
    const tests = await DiagnosticTest.findAll({
      include: [
        {
          model: DiagnosticCentre,
          attributes: ["id", "name", "location"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: tests,
    });
  } catch (error) {
    console.error("Get tests error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getTestById = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await DiagnosticTest.findByPk(id, {
      include: [
        {
          model: DiagnosticCentre,
          attributes: ["id", "name", "location"],
        },
      ],
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Diagnostic test not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: test,
    });
  } catch (error) {
    console.error("Get test error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createTest,
  getTests,
  getTestById,
};