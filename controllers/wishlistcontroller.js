const users = require("../models/userModel");
const categories = require("../models/category");
const Cart = require("../models/cart");
const product = require("../models/product");
const Address = require("../models/address");
const Wishlist = require("../models/wishlist");
const { logout } = require("./adminController");
const wishlist = require("../models/wishlist");

const wishlistLoad = async (req, res) => {
  try {
    const wishlistData = await Wishlist.find({
      user: req.session.user_id,
    }).populate("products.product");
    const wishlistCount = wishlistData.map(
      (wishlistDoc) => wishlistDoc.products.length
    );
    res.render("wishlist", { wishlistData, wishlistCount });
  } catch (error) {
    console.log(error);
  }
};
const addWishlist = async (req, res) => {
  try {
    const productId = req.body.productId;
    const userId = req.session.user_id;

    let userWishlist = await Wishlist.findOne({ user: userId });

    if (!userWishlist) {
      // If the user doesn't have a wishlist, create one
      userWishlist = new Wishlist({
        user: userId,
        products: [{ product: productId }],
      });
      await userWishlist.save();
      return res.status(200).json({ message: "added" });
    }

    // Check if the product is already in the wishlist
    const productIndex = userWishlist.products.findIndex(
      (item) => item.product.toString() === productId
    );

    if (productIndex > -1) {
      // If found, remove it
      userWishlist.products.splice(productIndex, 1);
      await userWishlist.save();
      return res.status(200).json({ message: "removed" });
    } else {
      // If not found, add to wishlist
      userWishlist.products.push({ product: productId });
      await userWishlist.save();
      return res.status(200).json({ message: "added" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const removeProductWishlist = async (req, res) => {
  try {
    const productId = req.body.productId;
    const deletedCart = await Wishlist.updateOne(
      { "products.product": productId },
      { $pull: { products: { product: productId } } }
    );

    res.status(200).json({ message: "succes" });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  wishlistLoad,
  addWishlist,
  removeProductWishlist,
};
