const express = require("express");

const {
  createBooking,
  getMyBookings,
  getBookingById,
} = require("../controllers/bookingController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// Create booking
router.post("/", authMiddleware, createBooking);


// Get current user's bookings
router.get("/", authMiddleware, getMyBookings);


// Get one booking
router.get("/:id", authMiddleware, getBookingById);


module.exports = router;