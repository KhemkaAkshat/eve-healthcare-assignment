const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "booking_id",
      unique: true,
    },

    paymentReference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "payment_reference",
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("SUCCESS", "FAILED"),
      allowNull: false,
    },
  },
  {
    tableName: "payments",
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = Payment;