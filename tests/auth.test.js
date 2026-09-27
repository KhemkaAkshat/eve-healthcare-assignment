const request = require("supertest");
const app = require("../src/server");
const sequelize = require("../src/config/database");
const { User } = require("../src/models");

jest.setTimeout(30000);

describe("Auth API", () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "password123";

  afterAll(async () => {
    try {
      await User.destroy({
        where: {
          email: testEmail,
        },
      });
    } finally {
      await sequelize.close();
    }
  });

  describe("POST /api/auth/signup", () => {
    test("should register a new user", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          name: "Test User",
          email: testEmail,
          password: testPassword,
        });

      expect(response.statusCode).toBe(201);

      expect(response.body.success).toBe(true);

      expect(response.body.message).toBe(
        "User registered successfully"
      );

      expect(response.body.data.user).toHaveProperty("id");

      expect(response.body.data.user.name).toBe("Test User");

      expect(response.body.data.user.email).toBe(testEmail);

      expect(response.body.data.user).not.toHaveProperty(
        "password"
      );

      expect(response.body.data).toHaveProperty("token");
    });

    test("should reject duplicate email", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          name: "Another User",
          email: testEmail,
          password: testPassword,
        });

      expect(response.statusCode).toBe(409);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "User with this email already exists"
      );
    });

    test("should reject invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          name: "Test User",
          email: "invalid-email",
          password: testPassword,
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe("Validation failed");
    });

    test("should reject a short password", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          name: "Test User",
          email: `short_${Date.now()}@example.com`,
          password: "123",
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe("Validation failed");
    });

    test("should reject a short name", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          name: "A",
          email: `name_${Date.now()}@example.com`,
          password: testPassword,
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe("Validation failed");
    });
  });

  describe("POST /api/auth/login", () => {
    test("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.statusCode).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.message).toBe("Login successful");

      expect(response.body.data.user.email).toBe(testEmail);

      expect(response.body.data.user).not.toHaveProperty(
        "password"
      );

      expect(response.body.data).toHaveProperty("token");
    });

    test("should reject an incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testEmail,
          password: "wrongpassword",
        });

      expect(response.statusCode).toBe(401);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "Invalid email or password"
      );
    });

    test("should reject a nonexistent user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: `nonexistent_${Date.now()}@example.com`,
          password: testPassword,
        });

      expect(response.statusCode).toBe(401);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "Invalid email or password"
      );
    });

    test("should reject invalid email format", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "invalid-email",
          password: testPassword,
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe("Validation failed");
    });

    test("should reject an empty password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testEmail,
          password: "",
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe("Validation failed");
    });
  });
});