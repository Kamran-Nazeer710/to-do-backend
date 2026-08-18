const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const { User, Todo, IdempotencyKey } = require("../models");

describe("Todo API", () => {
  let userA;
  let userB;
  let tokenA;
  let tokenB;

  beforeEach(async () => {
    await IdempotencyKey.destroy({
      where: {},
      truncate: true,
      cascade: true,
    });

    await Todo.destroy({
      where: {},
      truncate: true,
      cascade: true,
    });

    await User.destroy({
      where: {},
      truncate: true,
      cascade: true,
    });

    const registerA = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "User",
        lastName: "A",
        email: "usera@example.com",
        password: "Password123",
      });

    userA = registerA.body.data;

    const loginA = await request(app)
      .post("/api/auth/login")
      .send({
        email: "usera@example.com",
        password: "Password123",
      });

    tokenA = loginA.body.data.token;

    const registerB = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "User",
        lastName: "B",
        email: "userb@example.com",
        password: "Password123",
      });

    userB = registerB.body.data;

    const loginB = await request(app)
      .post("/api/auth/login")
      .send({
        email: "userb@example.com",
        password: "Password123",
      });

    tokenB = loginB.body.data.token;
  });

  describe("Authentication", () => {
    test("should reject request without token", async () => {
      const response = await request(app)
        .get("/api/todos");

      expect(response.statusCode).toBe(401);

      expect(response.body).toEqual({
        success: false,
        message: "Authorization header is required",
      });
    });

    test("should reject invalid token", async () => {
      const response = await request(app)
        .get("/api/todos")
        .set("Authorization", "Bearer invalid-token");

      expect(response.statusCode).toBe(401);

      expect(response.body).toEqual({
        success: false,
        message: "Invalid or expired token",
      });
    });
  });

  describe("POST /api/todos", () => {
    test("should create a Todo", async () => {
      const response = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenA}`)
        .set("Idempotency-Key", "create-todo-001")
        .send({
          title: "Learn CI/CD",
          description: "Learn GitHub Actions",
          priority: "high",
        });

      expect(response.statusCode).toBe(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Todo created successfully"
      );

      expect(response.body.data).toEqual(
        expect.objectContaining({
          userId: userA.id,
          title: "Learn CI/CD",
          description: "Learn GitHub Actions",
          completed: false,
          priority: "high",
        })
      );
    });

    test("should require Idempotency-Key", async () => {
      const response = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          title: "Todo without key",
        });

      expect(response.statusCode).toBe(400);

      expect(response.body).toEqual({
        success: false,
        message: "Idempotency-Key header is required",
      });
    });

    test("should require Todo title", async () => {
      const response = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenA}`)
        .set("Idempotency-Key", "create-todo-title-001")
        .send({
          description: "No title",
        });

      expect(response.statusCode).toBe(400);

      expect(response.body).toEqual({
        success: false,
        message: "Todo title is required",
      });
    });
  });

  describe("GET /api/todos", () => {
    test("should return only the authenticated user's Todos", async () => {
      await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenA}`)
        .set("Idempotency-Key", "user-a-todo-001")
        .send({
          title: "User A Todo",
          priority: "high",
        });

      await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenB}`)
        .set("Idempotency-Key", "user-b-todo-001")
        .send({
          title: "User B Todo",
          priority: "low",
        });

      const response = await request(app)
        .get("/api/todos")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(response.statusCode).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe(
        "User A Todo"
      );
      expect(response.body.data[0].userId).toBe(userA.id);
    });

    test("should support pagination", async () => {
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${tokenA}`)
          .set("Idempotency-Key", `pagination-${i}`)
          .send({
            title: `Todo ${i}`,
          });
      }

      const response = await request(app)
        .get("/api/todos?page=1&limit=2")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(response.statusCode).toBe(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.totalPages).toBe(2);
    });
  });

  describe("GET /api/todos/:id", () => {
    test("should return user's own Todo", async () => {
      const createResponse = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenA}`)
        .set("Idempotency-Key", "get-own-todo-001")
        .send({
          title: "My Todo",
          priority: "medium",
        });

      const todoId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/todos/${todoId}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(response.statusCode).toBe(200);

      expect(response.body.data.id).toBe(todoId);
      expect(response.body.data.userId).toBe(userA.id);
    });

    test("should not allow user to access another user's Todo", async () => {
      const createResponse = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenB}`)
        .set("Idempotency-Key", "private-todo-001")
        .send({
          title: "Private Todo",
        });

      const todoId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/todos/${todoId}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(response.statusCode).toBe(404);

      expect(response.body).toEqual({
        success: false,
        message: "Todo not found",
      });
    });
  });

  describe("PUT /api/todos/:id", () => {
    test("should update user's own Todo", async () => {
      const createResponse = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenA}`)
        .set("Idempotency-Key", "update-todo-001")
        .send({
          title: "Old Title",
          priority: "low",
        });

      const todoId = createResponse.body.data.id;

      const response = await request(app)
        .put(`/api/todos/${todoId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          title: "Updated Title",
          priority: "high",
        });

      expect(response.statusCode).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(
        "Updated Title"
      );
      expect(response.body.data.priority).toBe("high");
    });

    test("should not allow updating another user's Todo", async () => {
      const createResponse = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenB}`)
        .set("Idempotency-Key", "update-private-001")
        .send({
          title: "User B Todo",
        });

      const todoId = createResponse.body.data.id;

      const response = await request(app)
        .put(`/api/todos/${todoId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          title: "Hacked Todo",
        });

      expect(response.statusCode).toBe(404);

      expect(response.body).toEqual({
        success: false,
        message: "Todo not found",
      });
    });
  });

  describe("PATCH /api/todos/:id/complete", () => {
    test("should mark Todo as completed", async () => {
      const createResponse = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenA}`)
        .set("Idempotency-Key", "complete-todo-001")
        .send({
          title: "Complete Me",
        });

      const todoId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/todos/${todoId}/complete`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          completed: true,
        });

      expect(response.statusCode).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Todo marked as completed"
      );
      expect(response.body.data.completed).toBe(true);
    });

    test("should mark Todo as uncompleted", async () => {
      const createResponse = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenA}`)
        .set("Idempotency-Key", "uncomplete-todo-001")
        .send({
          title: "Uncomplete Me",
        });

      const todoId = createResponse.body.data.id;

      await request(app)
        .patch(`/api/todos/${todoId}/complete`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          completed: true,
        });

      const response = await request(app)
        .patch(`/api/todos/${todoId}/complete`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          completed: false,
        });

      expect(response.statusCode).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Todo marked as uncompleted"
      );
      expect(response.body.data.completed).toBe(false);
    });
  });

  describe("DELETE /api/todos/:id", () => {
    test("should delete user's own Todo", async () => {
      const createResponse = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenA}`)
        .set("Idempotency-Key", "delete-todo-001")
        .send({
          title: "Delete Me",
        });

      const todoId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/todos/${todoId}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(response.statusCode).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: "Todo deleted successfully",
      });

      const getResponse = await request(app)
        .get(`/api/todos/${todoId}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(getResponse.statusCode).toBe(404);
    });

    test("should not allow deleting another user's Todo", async () => {
      const createResponse = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenB}`)
        .set("Idempotency-Key", "delete-private-001")
        .send({
          title: "User B Todo",
        });

      const todoId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/todos/${todoId}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(response.statusCode).toBe(404);

      expect(response.body).toEqual({
        success: false,
        message: "Todo not found",
      });
    });
  });

  describe("Idempotency", () => {
    test("should return the same response for the same key and same request", async () => {
      const payload = {
        title: "Idempotent Todo",
        description: "Same request",
        priority: "high",
      };

      const firstResponse = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenA}`)
        .set("Idempotency-Key", "idempotency-001")
        .send(payload);

      const secondResponse = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenA}`)
        .set("Idempotency-Key", "idempotency-001")
        .send(payload);

      expect(firstResponse.statusCode).toBe(201);
      expect(secondResponse.statusCode).toBe(201);

      expect(secondResponse.body).toEqual(
        firstResponse.body
      );

      const todos = await Todo.findAll({
        where: {
          userId: userA.id,
        },
      });

      expect(todos).toHaveLength(1);
    });

    test("should reject same key with different request", async () => {
      await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenA}`)
        .set("Idempotency-Key", "idempotency-002")
        .send({
          title: "First Todo",
        });

      const response = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${tokenA}`)
        .set("Idempotency-Key", "idempotency-002")
        .send({
          title: "Different Todo",
        });

      expect(response.statusCode).toBe(409);

      expect(response.body).toEqual({
        success: false,
        message:
          "Idempotency-Key has already been used with a different request",
      });
    });
  });
});