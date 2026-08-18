const request = require("supertest");
const app = require("../src/app");

const { User } = require("../models");

describe("Authentication API", () => {
  beforeEach(async () => {
    await User.destroy({
      where: {},
      truncate: true,
      cascade: true,
    });
  });

  describe("POST /api/auth/register", () => {
    test("should register a new user", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          password: "Password123",
        });

      expect(response.statusCode).toBe(201);

      expect(response.body).toEqual({
        success: true,
        message: "User registered successfully",
        data: {
          id: expect.anything(),
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
        },
      });
    });

    test("should reject duplicate email", async () => {
      const user = {
        firstName: "Test",
        lastName: "User",
        email: "duplicate@example.com",
        password: "Password123",
      };

      await request(app)
        .post("/api/auth/register")
        .send(user);

      const response = await request(app)
        .post("/api/auth/register")
        .send(user);

      expect(response.statusCode).toBe(409);

      expect(response.body).toEqual({
        success: false,
        message: "User with this email already exists",
      });
    });
  });

  describe("POST /api/auth/login", () => {
    const user = {
      firstName: "Login",
      lastName: "User",
      email: "login@example.com",
      password: "Password123",
    };

    beforeEach(async () => {
      await request(app)
        .post("/api/auth/register")
        .send(user);
    });

    test("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: user.email,
          password: user.password,
        });

      expect(response.statusCode).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Login successful");

      expect(response.body.data.user).toEqual({
        id: expect.anything(),
        firstName: "Login",
        lastName: "User",
        email: "login@example.com",
      });

      expect(response.body.data.token).toEqual(expect.any(String));
    });

    test("should reject incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: user.email,
          password: "WrongPassword",
        });

      expect(response.statusCode).toBe(401);

      expect(response.body).toEqual({
        success: false,
        message: "Invalid  password",
      });
    });

    test("should reject nonexistent email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "doesnotexist@example.com",
          password: "Password123",
        });

      expect(response.statusCode).toBe(401);

      expect(response.body).toEqual({
        success: false,
        message: "Invalid email ",
      });
    });
  });
});