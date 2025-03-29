const mongoose = require("mongoose");
const address = require("./address");

const orderSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  orderId: {
    type: Number,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
      },
      quantity: {
        type: Number,
      },

      status: {
        type: String,
        enum: [
          "Order confirmed",
          "delivered",
          "cancelled",
          "Return request sended",
          "Returned",
          "Return Denied",
          "payment failed",
        ],
        default: "Order confirmed",
      },
      total: {
        type: Number,
      },
      returnReason: {
        type: String,
      },
    },
  ],
  paymentMethod: {
    type: String,
    enum: ["cashOnDelivery", "Razorpay", "Wallet", "Razorpay payment failed"],
    // required: true
  },
  totalAmount: {
    type: Number,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "address",
  },
  razorpayOrderId: {
    type: String,
  },
  razorpayPaymentId: {
    type: String,
  },
  razorpaySignature: {
    type: String,
  },
  paymentStatus: {
    type: String,
    enum: ["payment failed", "payment success"],
  },
});
module.exports = mongoose.model("order", orderSchema);
