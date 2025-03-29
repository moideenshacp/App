const mongoose = require("mongoose");
const product = require("./product");

const wishlistSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("wishlist", wishlistSchema);
