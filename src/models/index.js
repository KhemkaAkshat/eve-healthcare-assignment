const User = require("./User");
const DiagnosticCentre = require("./DiagnosticCentre");
const DiagnosticTest = require("./DiagnosticTest");
const Booking = require("./Booking");
const Payment = require("./Payment");
const WebhookEvent = require("./WebhookEvent");


User.hasMany(Booking, {
  foreignKey: "userId",
});

Booking.belongsTo(User, {
  foreignKey: "userId",
});

DiagnosticCentre.hasMany(DiagnosticTest, {
  foreignKey: "centreId",
});

DiagnosticTest.belongsTo(DiagnosticCentre, {
  foreignKey: "centreId",
});

DiagnosticCentre.hasMany(Booking, {
  foreignKey: "centreId",
});

Booking.belongsTo(DiagnosticCentre, {
  foreignKey: "centreId",
});


DiagnosticTest.hasMany(Booking, {
  foreignKey: "testId",
});

Booking.belongsTo(DiagnosticTest, {
  foreignKey: "testId",
});


Booking.hasOne(Payment, {
  foreignKey: "bookingId",
});

Payment.belongsTo(Booking, {
  foreignKey: "bookingId",
});

module.exports = {
  User,
  DiagnosticCentre,
  DiagnosticTest,
  Booking,
  Payment,
  WebhookEvent,
};