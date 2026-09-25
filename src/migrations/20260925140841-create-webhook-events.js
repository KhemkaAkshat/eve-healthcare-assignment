"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("webhook_events", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      event_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      payment_reference: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: "payments",
          key: "payment_reference",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      status: {
        type: Sequelize.ENUM("SUCCESS", "FAILED"),
        allowNull: false,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("webhook_events");
  },
};