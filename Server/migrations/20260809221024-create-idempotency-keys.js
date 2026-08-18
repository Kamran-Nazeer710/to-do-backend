"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("IdempotencyKeys", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      key: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      requestHash: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },

      responseStatus: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      responseBody: {
        type: Sequelize.JSONB,
        allowNull: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addConstraint(
      "IdempotencyKeys",
      {
        fields: ["userId", "key"],
        type: "unique",
        name: "unique_idempotency_key_per_user",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("IdempotencyKeys");
  },
};
