"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    static associate(models) {
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  Todo.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Todo title is required",
          },
        },
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      completed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      priority: {
        type: DataTypes.ENUM("low", "medium", "high"),
        allowNull: false,
        defaultValue: "medium",
      },
    },
    {
      sequelize,
      modelName: "Todo",
      tableName: "Todos",
      timestamps: true,
    }
  );

  return Todo;
};