const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Booking = sequelize.define(
  "Booking",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },

    testId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "test_id",
    },

    centreId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "centre_id",
    },

    appointmentAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "appointment_at",
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "CONFIRMED",
        "FAILED",
        "CANCELLED"
      ),
      allowNull: false,
      defaultValue: "PENDING",
    },
  },
  {
    tableName: "bookings",
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = Booking;