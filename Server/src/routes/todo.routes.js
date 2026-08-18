const express = require("express");

const todoController = require("../controllers/todo.controller");
const authenticate = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  todoController.createTodo
);

router.get(
  "/",
  authenticate,
  todoController.getUserTodos
);

router.get(
  "/:id",
  authenticate,
  todoController.getTodoById
);

router.put(
  "/:id",
  authenticate,
  todoController.updateTodo
);

router.delete(
  "/:id",
  authenticate,
  todoController.deleteTodo
);

router.patch(
  "/:id/complete",
  authenticate,
  todoController.toggleTodoCompletion
);

module.exports = router;