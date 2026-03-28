const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  source: String,
  assignedTo: String, // 👈 NEW
  status: {
    type: String,
    default: "new",
  },
  notes: [
    {
      text: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model("Lead", leadSchema);