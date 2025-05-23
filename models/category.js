const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  offerprice: {
    type: Number,
  },
  is_listed: {
    type: Boolean,
    default: true,
  },
});
module.exports = mongoose.model("category", categorySchema);
