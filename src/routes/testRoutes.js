const express = require("express");

const {
  createTest,
  getTests,
  getTestById,
} = require("../controllers/testController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createTest);
router.get("/", getTests);
router.get("/:id", getTestById);

module.exports = router;