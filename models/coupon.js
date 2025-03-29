const mongoose = require("mongoose");

const couponSchema = mongoose.Schema({
  name: {
    type: String,
  },
  code: {
    type: Number,
  },
  minAmount: {
    type: Number,
  },
  discount: {
    type: Number,
  },
  expireDate: {
    type: Date,
  },
  status: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
  },
  usedUsers: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
      used: {
        type: Boolean,
        default: false,
      },
    },
  ],
});

module.exports = mongoose.model("coupon", couponSchema);
