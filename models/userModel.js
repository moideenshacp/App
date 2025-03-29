const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
  },
  mobile: {
    type: String,
  },
  is_admin: {
    type: Number,
  },
  referralCode: {
    type: Number,
  },
  is_blocked: {
    type: Boolean,
    default: false,
  },
  wallet: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("users", userSchema);
