const request = require("supertest");
const app = require("../src/server");
const sequelize = require("../src/config/database");

const {
  User,
  DiagnosticCentre,
  DiagnosticTest,
  Booking,
} = require("../src/models");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

jest.setTimeout(30000);

describe("Booking API", () => {
  let user;
  let anotherUser;
  let centre;
  let anotherCentre;
  let diagnosticTest;
  let anotherTest;
  let token;
  let anotherUserToken;
  let booking;

  beforeAll(async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash("password123", 10);

    user = await User.create({
      name: "Booking Test User",
      email: `booking_${Date.now()}@example.com`,
      password: hashedPassword,
    });

    anotherUser = await User.create({
      name: "Another Booking User",
      email: `another_booking_${Date.now()}@example.com`,
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

    // Create diagnostic centres
    centre = await DiagnosticCentre.create({
      name: "Test Diagnostic Centre",
      location: "Delhi",
    });

    anotherCentre = await DiagnosticCentre.create({
      name: "Another Diagnostic Centre",
      location: "Noida",
    });

    // Create diagnostic tests
    diagnosticTest = await DiagnosticTest.create({
      centreId: centre.id,
      name: "Complete Blood Count",
      price: 500,
    });

    anotherTest = await DiagnosticTest.create({
      centreId: anotherCentre.id,
      name: "Lipid Profile",
      price: 800,
    });
  });

  afterAll(async () => {
    try {
      // Delete bookings first because they reference
      // users, centres and tests
      await Booking.destroy({
        where: {
          userId: [user.id, anotherUser.id],
        },
      });

      await DiagnosticTest.destroy({
        where: {
          id: [diagnosticTest.id, anotherTest.id],
        },
      });

      await DiagnosticCentre.destroy({
        where: {
          id: [centre.id, anotherCentre.id],
        },
      });

      await User.destroy({
        where: {
          id: [user.id, anotherUser.id],
        },
      });
    } finally {
      await sequelize.close();
    }
  });

  describe("POST /api/bookings", () => {
    test("should create a booking successfully", async () => {
      const appointmentAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();

      const response = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          testId: diagnosticTest.id,
          centreId: centre.id,
          appointmentAt,
        });

      expect(response.statusCode).toBe(201);

      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveProperty("id");

      expect(response.body.data.userId).toBe(user.id);

      expect(response.body.data.testId).toBe(
        diagnosticTest.id
      );

      expect(response.body.data.centreId).toBe(centre.id);

      expect(response.body.data.status).toBe("PENDING");

      expect(Number(response.body.data.amount)).toBe(500);

      booking = response.body.data;
    });

    test("should reject booking without authentication", async () => {
      const appointmentAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();

      const response = await request(app)
        .post("/api/bookings")
        .send({
          testId: diagnosticTest.id,
          centreId: centre.id,
          appointmentAt,
        });

      expect(response.statusCode).toBe(401);

      expect(response.body.success).toBe(false);
    });

    test("should reject booking with an invalid test ID", async () => {
      const appointmentAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();

      const response = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          testId: 999999,
          centreId: centre.id,
          appointmentAt,
        });

      expect(response.statusCode).toBe(404);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "Diagnostic test not found"
      );
    });

    test("should reject booking when test and centre do not match", async () => {
      const appointmentAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();

      const response = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          testId: diagnosticTest.id,
          centreId: anotherCentre.id,
          appointmentAt,
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "Diagnostic test does not belong to the selected centre"
      );
    });

    test("should reject a booking with a past appointment", async () => {
      const appointmentAt = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const response = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          testId: diagnosticTest.id,
          centreId: centre.id,
          appointmentAt,
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "Appointment time must be in the future"
      );
    });

    test("should reject invalid booking data", async () => {
      const response = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          testId: "invalid",
          centreId: centre.id,
          appointmentAt: "invalid-date",
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe("Validation failed");
    });
  });

  describe("GET /api/bookings", () => {
    test("should return bookings belonging to the authenticated user", async () => {
      const response = await request(app)
        .get("/api/bookings")
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(200);

      expect(response.body.success).toBe(true);

      expect(Array.isArray(response.body.data)).toBe(true);

      expect(response.body.data.length).toBeGreaterThan(0);

      expect(
        response.body.data.every(
          (item) => item.userId === user.id
        )
      ).toBe(true);
    });

    test("should reject unauthenticated request", async () => {
      const response = await request(app)
        .get("/api/bookings");

      expect(response.statusCode).toBe(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/bookings/:id", () => {
    test("should return the user's booking", async () => {
      const response = await request(app)
        .get(`/api/bookings/${booking.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data.id).toBe(booking.id);

      expect(response.body.data.userId).toBe(user.id);
    });

    test("should return 404 for a non-existent booking", async () => {
      const response = await request(app)
        .get("/api/bookings/999999")
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(404);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "Booking not found"
      );
    });

    test("should not allow a user to access another user's booking", async () => {
      const response = await request(app)
        .get(`/api/bookings/${booking.id}`)
        .set(
          "Authorization",
          `Bearer ${anotherUserToken}`
        );

      expect(response.statusCode).toBe(404);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "Booking not found"
      );
    });

    test("should reject unauthenticated request", async () => {
      const response = await request(app)
        .get(`/api/bookings/${booking.id}`);

      expect(response.statusCode).toBe(401);

      expect(response.body.success).toBe(false);
    });
  });
});