const { DiagnosticCentre } = require("../models");
const { createCentreSchema } = require("../validations/centreValidation");

const createCentre = async (req, res) => {
  try {
    const validationResult = createCentreSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.issues,
      });
    }

    const { name, location } = validationResult.data;

    const centre = await DiagnosticCentre.create({
      name,
      location,
    });

    return res.status(201).json({
      success: true,
      message: "Diagnostic centre created successfully",
      data: centre,
    });
  } catch (error) {
    console.error("Create centre error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getCentres = async (req, res) => {
  try {
    const centres = await DiagnosticCentre.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: centres,
    });
  } catch (error) {
    console.error("Get centres error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getCentreById = async (req, res) => {
  try {
    const { id } = req.params;

    const centre = await DiagnosticCentre.findByPk(id);

    if (!centre) {
      return res.status(404).json({
        success: false,
        message: "Diagnostic centre not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: centre,
    });
  } catch (error) {
    console.error("Get centre error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createCentre,
  getCentres,
  getCentreById,
};