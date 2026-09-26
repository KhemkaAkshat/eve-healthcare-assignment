const {
  Booking,
  DiagnosticTest,
  DiagnosticCentre,
} = require("../models");

const {
  createBookingSchema,
} = require("../validations/bookingValidation");


// Create a new booking
const createBooking = async (req, res) => {
  try {
    // Validate request body
    const validationResult = createBookingSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.issues,
      });
    }

    const { testId, centreId, appointmentAt } = validationResult.data;

    // User comes from JWT authentication
    const userId = req.user.id;

    // Check if centre exists
    const centre = await DiagnosticCentre.findByPk(centreId);

    if (!centre) {
      return res.status(404).json({
        success: false,
        message: "Diagnostic centre not found",
      });
    }

    // Check if test exists
    const test = await DiagnosticTest.findByPk(testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Diagnostic test not found",
      });
    }

    // Make sure test belongs to selected centre
    if (test.centreId !== centreId) {
      return res.status(400).json({
        success: false,
        message: "Diagnostic test does not belong to the selected centre",
      });
    }

    // Convert appointment time into Date
    const appointmentDate = new Date(appointmentAt);

    // Appointment must be in the future
    if (appointmentDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Appointment time must be in the future",
      });
    }

    // Create booking
    const booking = await Booking.create({
      userId,
      testId,
      centreId,
      appointmentAt: appointmentDate,

      // Price comes from database, not client
      amount: test.price,

      // Every new booking starts as PENDING
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Get all bookings of authenticated user
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.findAll({
      where: {
        userId,
      },
      include: [
        {
          model: DiagnosticTest,
          attributes: ["id", "name", "price"],
        },
        {
          model: DiagnosticCentre,
          attributes: ["id", "name", "location"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Get bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Get one booking of authenticated user
const getBookingById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const booking = await Booking.findOne({
      where: {
        id,
        userId,
      },
      include: [
        {
          model: DiagnosticTest,
          attributes: ["id", "name", "price"],
        },
        {
          model: DiagnosticCentre,
          attributes: ["id", "name", "location"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Get booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
};