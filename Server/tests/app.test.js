const request = require("supertest");
const app = require("../src/app");

describe("Application", () => {
  test("GET /test-login-route should return 200", async () => {
    const response = await request(app)
      .get("/test-login-route");

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "App is receiving routes correctly",
    });
  });
});