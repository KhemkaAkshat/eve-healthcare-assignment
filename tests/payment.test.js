const request = require("supertest");
const app = require("../src/server");
const sequelize = require("../src/config/database");

const {
  User,
  DiagnosticCentre,
  DiagnosticTest,
  Booking,
  Payment,
  WebhookEvent,
} = require("../src/models");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

jest.setTimeout(30000);

describe("Payment API", () => {
  let user;
  let anotherUser;

  let centre;
  let diagnosticTest;

  let bookingSuccess;
  let bookingFailed;
  let bookingDuplicate;

  let token;
  let anotherUserToken;

  let successPayment;
  let failedPayment;

  beforeAll(async () => {
    // Create users
    const hashedPassword = await bcrypt.hash("password123", 10);

    user = await User.create({
      name: "Payment Test User",
      email: `payment_${Date.now()}@example.com`,
      password: hashedPassword,
    });

    anotherUser = await User.create({
      name: "Another Payment User",
      email: `another_payment_${Date.now()}@example.com`,
      password: hashedPassword,
    });

    // Generate JWT tokens
    token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    anotherUserToken = jwt.sign(
      { userId: anotherUser.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Create diagnostic centre
    centre = await DiagnosticCentre.create({
      name: "Payment Test Centre",
      location: "Delhi",
    });

    // Create diagnostic test
    diagnosticTest = await DiagnosticTest.create({
      centreId: centre.id,
      name: "Blood Test",
      price: 1000,
    });

    // Create bookings for different payment scenarios
    bookingSuccess = await Booking.create({
      userId: user.id,
      testId: diagnosticTest.id,
      centreId: centre.id,
      appointmentAt: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ),
      amount: 1000,
      status: "PENDING",
    });

    bookingFailed = await Booking.create({
      userId: user.id,
      testId: diagnosticTest.id,
      centreId: centre.id,
      appointmentAt: new Date(
        Date.now() + 48 * 60 * 60 * 1000
      ),
      amount: 1000,
      status: "PENDING",
    });

    bookingDuplicate = await Booking.create({
      userId: user.id,
      testId: diagnosticTest.id,
      centreId: centre.id,
      appointmentAt: new Date(
        Date.now() + 72 * 60 * 60 * 1000
      ),
      amount: 1000,
      status: "PENDING",
    });
  });

  afterAll(async () => {
    try {
      // Delete webhook events first
      await WebhookEvent.destroy({
        where: {},
      });

      // Delete payments
      await Payment.destroy({
        where: {
          bookingId: [
            bookingSuccess.id,
            bookingFailed.id,
            bookingDuplicate.id,
          ],
        },
      });

      // Delete bookings
      await Booking.destroy({
        where: {
          id: [
            bookingSuccess.id,
            bookingFailed.id,
            bookingDuplicate.id,
          ],
        },
      });

      // Delete diagnostic test
      await DiagnosticTest.destroy({
        where: {
          id: diagnosticTest.id,
        },
      });

      // Delete diagnostic centre
      await DiagnosticCentre.destroy({
        where: {
          id: centre.id,
        },
      });

      // Delete users
      await User.destroy({
        where: {
          id: [user.id, anotherUser.id],
        },
      });
    } finally {
      await sequelize.close();
    }
  });

  describe("POST /api/payments", () => {
    test("should create a successful payment", async () => {
      // Force Math.random() to return a value
      // that produces SUCCESS in the controller.
      jest.spyOn(Math, "random").mockReturnValue(0.5);

      const response = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookingId: bookingSuccess.id,
        });

      expect(response.statusCode).toBe(201);

      expect(response.body.success).toBe(true);

      expect(response.body.message).toBe("Payment successful");

      expect(response.body.data).toHaveProperty("payment");

      expect(response.body.data).toHaveProperty("booking");

      expect(response.body.data.payment.bookingId).toBe(
        bookingSuccess.id
      );

      expect(
        Number(response.body.data.payment.amount)
      ).toBe(1000);

      expect(response.body.data.payment.status).toBe("SUCCESS");

      expect(response.body.data.booking.status).toBe(
        "CONFIRMED"
      );

      successPayment = response.body.data.payment;

      jest.restoreAllMocks();
    });

    test("should create a failed payment", async () => {
      // Force Math.random() to return a value
      // that produces FAILED in the controller.
      jest.spyOn(Math, "random").mockReturnValue(0.99);

      const response = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookingId: bookingFailed.id,
        });

      expect(response.statusCode).toBe(201);

      expect(response.body.success).toBe(true);

      expect(response.body.message).toBe("Payment failed");

      expect(response.body.data.payment.status).toBe(
        "FAILED"
      );

      expect(response.body.data.booking.status).toBe(
        "FAILED"
      );

      expect(
        Number(response.body.data.payment.amount)
      ).toBe(1000);

      failedPayment = response.body.data.payment;

      jest.restoreAllMocks();
    });

    test("should reject payment without authentication", async () => {
      const response = await request(app)
        .post("/api/payments")
        .send({
          bookingId: bookingDuplicate.id,
        });

      expect(response.statusCode).toBe(401);

      expect(response.body.success).toBe(false);
    });

    test("should reject an invalid booking ID", async () => {
      const response = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookingId: 999999,
        });

      expect(response.statusCode).toBe(404);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "Booking not found"
      );
    });

    test("should not allow another user to pay for the booking", async () => {
      const response = await request(app)
        .post("/api/payments")
        .set(
          "Authorization",
          `Bearer ${anotherUserToken}`
        )
        .send({
          bookingId: bookingDuplicate.id,
        });

      expect(response.statusCode).toBe(404);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "Booking not found"
      );
    });

    test("should reject duplicate payment for the same booking", async () => {
      // First payment
      jest.spyOn(Math, "random").mockReturnValue(0.5);

      const firstResponse = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookingId: bookingDuplicate.id,
        });

      expect(firstResponse.statusCode).toBe(201);

      jest.restoreAllMocks();

      // Second payment for the same booking
      const secondResponse = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookingId: bookingDuplicate.id,
        });

      expect(secondResponse.statusCode).toBe(409);

      expect(secondResponse.body.success).toBe(false);

      expect(secondResponse.body.message).toBe(
        "Payment already exists for this booking"
      );
    });
  });

  describe("POST /api/payments/webhook", () => {
    test("should process a successful payment webhook", async () => {
      const eventId = `evt_success_${Date.now()}`;

      const response = await request(app)
        .post("/api/payments/webhook")
        .send({
          eventId,
          paymentReference: successPayment.paymentReference,
          status: "SUCCESS",
        });

      expect(response.statusCode).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.message).toBe(
        "Payment webhook processed successfully"
      );

      expect(response.body.data.payment.paymentReference).toBe(
        successPayment.paymentReference
      );

      expect(response.body.data.booking.status).toBe(
        "CONFIRMED"
      );
    });

    test("should process a failed payment webhook", async () => {
      const eventId = `evt_failed_${Date.now()}`;

      const response = await request(app)
        .post("/api/payments/webhook")
        .send({
          eventId,
          paymentReference: failedPayment.paymentReference,
          status: "FAILED",
        });

      expect(response.statusCode).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.message).toBe(
        "Payment webhook processed successfully"
      );

      expect(response.body.data.payment.paymentReference).toBe(
        failedPayment.paymentReference
      );

      expect(response.body.data.booking.status).toBe(
        "FAILED"
      );
    });

    test("should reject webhook for an unknown payment", async () => {
      const response = await request(app)
        .post("/api/payments/webhook")
        .send({
          eventId: `evt_unknown_${Date.now()}`,
          paymentReference: "PAY_NON_EXISTENT",
          status: "SUCCESS",
        });

      expect(response.statusCode).toBe(404);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "Payment not found"
      );
    });

    test("should reject webhook when status does not match payment status", async () => {
      const response = await request(app)
        .post("/api/payments/webhook")
        .send({
          eventId: `evt_mismatch_${Date.now()}`,
          paymentReference: successPayment.paymentReference,
          status: "FAILED",
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "Webhook status does not match payment status"
      );
    });

    test("should reject invalid webhook data", async () => {
      const response = await request(app)
        .post("/api/payments/webhook")
        .send({
          eventId: "",
          paymentReference: "",
          status: "INVALID",
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe("Validation failed");
    });

    test("should process the same webhook event only once", async () => {
      const eventId = `evt_duplicate_${Date.now()}`;

      const firstResponse = await request(app)
        .post("/api/payments/webhook")
        .send({
          eventId,
          paymentReference: successPayment.paymentReference,
          status: "SUCCESS",
        });

      expect(firstResponse.statusCode).toBe(200);

      expect(firstResponse.body.success).toBe(true);

      // Send the exact same event again
      const secondResponse = await request(app)
        .post("/api/payments/webhook")
        .send({
          eventId,
          paymentReference: successPayment.paymentReference,
          status: "SUCCESS",
        });

      expect(secondResponse.statusCode).toBe(200);

      expect(secondResponse.body.success).toBe(true);

      expect(secondResponse.body.message).toBe(
        "Webhook event already processed"
      );
    });

    test("should allow webhook without authentication", async () => {
      const eventId = `evt_no_auth_${Date.now()}`;

      const response = await request(app)
        .post("/api/payments/webhook")
        .send({
          eventId,
          paymentReference: successPayment.paymentReference,
          status: "SUCCESS",
        });

      expect(response.statusCode).toBe(200);

      expect(response.body.success).toBe(true);
    });
  });
});