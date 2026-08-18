"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Todos", "priority", {
      type: Sequelize.ENUM("low", "medium", "high"),
      allowNull: false,
      defaultValue: "medium",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Todos", "priority");

    // PostgreSQL ENUM cleanup
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Todos_priority";'
    );
  },
};