const mongoose = require("mongoose");

// Generic flexible schema
const AnySchema = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model("User", AnySchema);
