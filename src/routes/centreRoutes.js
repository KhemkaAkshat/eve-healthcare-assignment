const express = require("express");

const {
  createCentre,
  getCentres,
  getCentreById,
} = require("../controllers/centreController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createCentre);
router.get("/", getCentres);
router.get("/:id", getCentreById);

module.exports = router;