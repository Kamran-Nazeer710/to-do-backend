const todoService = require("../services/todo.service");
const idempotencyService = require("../services/idempotency.service");

/*
|--------------------------------------------------------------------------
| Create Todo
|--------------------------------------------------------------------------
*/

const createTodo = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { title, description, completed, priority } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate Idempotency-Key
    |--------------------------------------------------------------------------
    */

    const idempotencyKey = req.headers["idempotency-key"];

    if (!idempotencyKey) {
      return res.status(400).json({
        success: false,
        message: "Idempotency-Key header is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Todo
    |--------------------------------------------------------------------------
    */

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Todo title is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Generate request hash
    |--------------------------------------------------------------------------
    */

    const requestHash =
      idempotencyService.generateRequestHash(req.body);

    /*
    |--------------------------------------------------------------------------
    | Check existing idempotency key
    |--------------------------------------------------------------------------
    */

    const existingKey =
      await idempotencyService.getIdempotencyKey(
        idempotencyKey,
        userId
      );

    if (existingKey) {
      /*
      | Same key but different request
      */

      if (existingKey.requestHash !== requestHash) {
        return res.status(409).json({
          success: false,
          message:
            "Idempotency-Key has already been used with a different request",
        });
      }

      /*
      | Same key + same request
      */

      if (
        existingKey.responseStatus !== null &&
        existingKey.responseBody !== null
      ) {
        return res
          .status(existingKey.responseStatus)
          .json(existingKey.responseBody);
      }

      /*
      | Request is still being processed
      */

      return res.status(409).json({
        success: false,
        message:
          "Request with this Idempotency-Key is already being processed",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create idempotency record
    |--------------------------------------------------------------------------
    */

    const idempotencyRecord =
      await idempotencyService.createIdempotencyKey({
        key: idempotencyKey,
        userId,
        requestHash,
      });

    /*
    |--------------------------------------------------------------------------
    | Create Todo
    |--------------------------------------------------------------------------
    */

    const todo = await todoService.createTodo({
      userId,
      title: title.trim(),
      description,
      completed,
      priority,
    });

    /*
    |--------------------------------------------------------------------------
    | Build response
    |--------------------------------------------------------------------------
    */

    const responseBody = {
      success: true,
      message: "Todo created successfully",
      data: todo,
    };

    /*
    |--------------------------------------------------------------------------
    | Save response against idempotency key
    |--------------------------------------------------------------------------
    */

    await idempotencyService.saveIdempotencyResponse({
      idempotencyRecord,
      responseStatus: 201,
      responseBody,
    });

    /*
    |--------------------------------------------------------------------------
    | Return response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json(responseBody);
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get User Todos
|--------------------------------------------------------------------------
*/

const getUserTodos = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Search
    const search = req.query.search || "";

    // Completed filter
    const completed = req.query.completed;

    // Sorting
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order || "desc";

    // Validate page
    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be greater than 0",
      });
    }

    // Validate limit
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 100",
      });
    }

    // Validate completed
    if (
      completed !== undefined &&
      completed !== "true" &&
      completed !== "false"
    ) {
      return res.status(400).json({
        success: false,
        message: "Completed must be true or false",
      });
    }

    // Allowed sort fields
    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "title",
    ];

    // Validate sort field
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort field",
      });
    }

    // Validate order
    if (order !== "asc" && order !== "desc") {
      return res.status(400).json({
        success: false,
        message: "Order must be asc or desc",
      });
    }

    const result = await todoService.getUserTodos(
      userId,
      page,
      limit,
      search,
      completed,
      sortBy,
      order
    );

    return res.status(200).json({
      success: true,
      message: "Todos retrieved successfully",
      data: result.todos,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(
          result.total / limit
        ),
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get Single Todo
|--------------------------------------------------------------------------
*/

const getTodoById = async (req, res, next) => {
  try {
    const todoId = req.params.id;
    const userId = req.user.id;

    const todo = await todoService.getTodoById(
      todoId,
      userId
    );

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Todo retrieved successfully",
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Update Todo
|--------------------------------------------------------------------------
*/

const updateTodo = async (req, res, next) => {
  try {
    const todoId = req.params.id;
    const userId = req.user.id;

    const {
      title,
      description,
      completed,
      priority,
    } = req.body;

    // At least one field required
    if (
      title === undefined &&
      description === undefined &&
      completed === undefined &&
      priority === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field is required to update",
      });
    }

    // Validate title
    if (
      title !== undefined &&
      (!title || title.trim() === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "Todo title cannot be empty",
      });
    }

    // Validate completed
    if (
      completed !== undefined &&
      typeof completed !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Completed must be a boolean",
      });
    }

    // Validate priority
    if (
      priority !== undefined &&
      !["low", "medium", "high"].includes(priority)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Priority must be low, medium, or high",
      });
    }

    const todo = await todoService.updateTodo({
      todoId,
      userId,

      title:
        title !== undefined
          ? title.trim()
          : undefined,

      description,
      completed,
      priority,
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Todo updated successfully",
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Delete Todo
|--------------------------------------------------------------------------
*/

const deleteTodo = async (req, res, next) => {
  try {
    const todoId = req.params.id;
    const userId = req.user.id;

    const todo = await todoService.deleteTodo(
      todoId,
      userId
    );

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Todo deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Complete / Uncomplete Todo
|--------------------------------------------------------------------------
*/

const toggleTodoCompletion = async (
  req,
  res,
  next
) => {
  try {
    const todoId = req.params.id;
    const userId = req.user.id;

    const { completed } = req.body;

    // Validate completed
    if (typeof completed !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Completed must be a boolean",
      });
    }

    const todo =
      await todoService.toggleTodoCompletion(
        todoId,
        userId,
        completed
      );

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: completed
        ? "Todo marked as completed"
        : "Todo marked as uncompleted",
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Export Controllers
|--------------------------------------------------------------------------
*/

module.exports = {
  createTodo,
  getUserTodos,
  getTodoById,
  updateTodo,
  deleteTodo,
  toggleTodoCompletion,
};