const { Todo, Sequelize } = require("../../models");

const { Op } = Sequelize;

/*
|--------------------------------------------------------------------------
| Create Todo
|--------------------------------------------------------------------------
*/

const createTodo = async ({
  userId,
  title,
  description,
  priority,
}) => {
  const todo = await Todo.create({
    userId,
    title,
    description,
    priority,
  });

  return todo;
};

/*
|--------------------------------------------------------------------------
| Get User Todos
|--------------------------------------------------------------------------
*/

const getUserTodos = async (
  userId,
  page = 1,
  limit = 10,
  search = "",
  completed,
  sortBy = "createdAt",
  order = "desc"
) => {
  const offset = (page - 1) * limit;

  const where = {
    userId,
  };

  // Search by title
  if (search.trim() !== "") {
    where.title = {
      [Op.iLike]: `%${search.trim()}%`,
    };
  }

  // Filter by completed status
  if (completed !== undefined) {
    where.completed = completed === "true";
  }

  const result = await Todo.findAndCountAll({
    where,
    order: [[sortBy, order.toUpperCase()]],
    limit,
    offset,
  });

  return {
    todos: result.rows,
    total: result.count,
  };
};

/*
|--------------------------------------------------------------------------
| Get Single Todo
|--------------------------------------------------------------------------
*/

const getTodoById = async (todoId, userId) => {
  const todo = await Todo.findOne({
    where: {
      id: todoId,
      userId,
    },
  });

  return todo;
};

/*
|--------------------------------------------------------------------------
| Update Todo
|--------------------------------------------------------------------------
*/

const updateTodo = async ({
  todoId,
  userId,
  title,
  description,
  completed,
  priority,
}) => {
  const todo = await Todo.findOne({
    where: {
      id: todoId,
      userId,
    },
  });

  if (!todo) {
    return null;
  }

  if (title !== undefined) {
    todo.title = title;
  }

  if (description !== undefined) {
    todo.description = description;
  }

  if (completed !== undefined) {
    todo.completed = completed;
  }

  if (priority !== undefined) {
    todo.priority = priority;
  }

  await todo.save();

  return todo;
};

/*
|--------------------------------------------------------------------------
| Delete Todo
|--------------------------------------------------------------------------
*/

const deleteTodo = async (todoId, userId) => {
  const todo = await Todo.findOne({
    where: {
      id: todoId,
      userId,
    },
  });

  if (!todo) {
    return null;
  }

  await todo.destroy();

  return todo;
};

/*
|--------------------------------------------------------------------------
| Complete / Uncomplete Todo
|--------------------------------------------------------------------------
*/

const toggleTodoCompletion = async (
  todoId,
  userId,
  completed
) => {
  const todo = await Todo.findOne({
    where: {
      id: todoId,
      userId,
    },
  });

  if (!todo) {
    return null;
  }

  todo.completed = completed;

  await todo.save();

  return todo;
};

/*
|--------------------------------------------------------------------------
| Export Services
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