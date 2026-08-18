"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class IdempotencyKey extends Model {
    static associate(models) {
      // Idempotency key belongs to a user
      IdempotencyKey.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  IdempotencyKey.init(
    {
      key: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      requestHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },

      responseStatus: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      responseBody: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "IdempotencyKey",
      tableName: "IdempotencyKeys",
    }
  );

  return IdempotencyKey;
};