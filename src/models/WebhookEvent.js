const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WebhookEvent = sequelize.define(
  "WebhookEvent",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    eventId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "event_id",
    },

    paymentReference: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "payment_reference",
    },

    status: {
      type: DataTypes.ENUM("SUCCESS", "FAILED"),
      allowNull: false,
    },
  },
  {
    tableName: "webhook_events",
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = WebhookEvent;