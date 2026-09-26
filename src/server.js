require("dotenv").config();

const express = require("express");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const centreRoutes = require("./routes/centreRoutes");
const testRoutes = require("./routes/testRoutes")
const bookingRoutes = require("./routes/bookingRoutes")
const paymentRoutes = require("./routes/paymentRoutes")
const {
  User,
  DiagnosticCentre,
  DiagnosticTest,
  Booking,
  Payment,
  WebhookEvent,
} = require("./models");

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/centres", centreRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EVE Healthcare API is running",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("Database connected successfully");
    console.log("Models loaded successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to database:", error.message);
  }
};

startServer();