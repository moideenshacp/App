const express = require("express");
const user_route = express();
const bodyparser = require("body-parser");
const session = require("express-session");
const config = require("../config/config");
user_route.use(session({ secret: config.sessionsecret }));

//middleware
const auth = require("../middleware/auth");
const blockAuth = require("../middleware/blockAuth");

//for view engine
user_route.set("view engine", "ejs");
user_route.set("views", "./views/users");

//controllers
const userController = require("../controllers/userController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderController");
const wishlistController = require("../controllers/wishlistcontroller");
const couponController = require("../controllers/couponController");

const passport = require("passport");

user_route.use(passport.initialize());
user_route.use(passport.session());

//bodyparser
user_route.use(bodyparser.json());
user_route.use(bodyparser.urlencoded({ extended: true }));

//loadhome
user_route.get("/", userController.loadHome);

//signup
user_route.get("/signup", auth.isLogout, userController.SignupHome);
user_route.post("/signup", userController.insertUser);

//login
user_route.get("/login", auth.isLogout, userController.loadLogin);
// user_route.post('/login',userController.insertUser)
user_route.post("/home", userController.verify);

//for otp
user_route.get("/otp", auth.isLogout, userController.loadOtp);
user_route.post("/otp", userController.verifyOtp);

//resend otp
user_route.post("/resendotp", userController.resendotp);

user_route.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

//google authentication
user_route.get(
  "/auth/google/callback",
  auth.isLogout,
  passport.authenticate("google", {
    successRedirect: "/success",
    failureRedirect: "/failure",
  })
);
//for success
user_route.get("/success", auth.isLogout, userController.googleInsert);
//failure
user_route.get("/failure", auth.isLogout, userController.failureLogin);

user_route.get(
  "/google",
  auth.isLogin,
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/home");
  }
);

//profile
user_route.get(
  "/profile",
  auth.isLogin,
  blockAuth.block,
  userController.loadprofile
);
user_route.get("/wallet/history", auth.isLogin, userController.wallet);

//userhome
user_route.get("/home", auth.isLogin, blockAuth.block, userController.userhome);

//signout
user_route.get("/signout", auth.isLogin, userController.signout);

//product
user_route.get(
  "/product",
  auth.isLogin,
  blockAuth.block,
  userController.loadproduct
);
user_route.get(
  "/productDetail",
  auth.isLogin,
  blockAuth.block,
  userController.productDetail
);

//shop
user_route.get("/shop", auth.isLogin, blockAuth.block, userController.shop);

//cart
user_route.get("/cart", auth.isLogin, cartController.loadCart);
user_route.post("/cart", auth.isLogin, cartController.addCart);
user_route.post("/removeProduct", auth.isLogin, cartController.removeProduct);
user_route.post("/totalPrice", auth.isLogin, cartController.totalPrice);

//create adress
user_route.get("/addAdress", auth.isLogin, userController.loadNewAdress);
user_route.post("/addAdress", auth.isLogin, userController.addAddress);
user_route.post("/removeAddress", auth.isLogin, userController.removeAddress);

//edit address
user_route.get("/edit-Address", auth.isLogin, userController.loadEditAddress);
user_route.post("/edit-Address", auth.isLogin, userController.updateAddress);

//load checkout
user_route.get("/checkout", auth.isLogin, cartController.loadCheckout);
//------------adddress add
user_route.get(
  "/checkoutAddress",
  auth.isLogin,
  cartController.checkoutAddressLoad
);
user_route.post(
  "/checkoutAddress",
  auth.isLogin,
  cartController.checkoutAddress
);
//-------------------edit adit
user_route.get(
  "/checkoutEditAddress",
  auth.isLogin,
  cartController.checkoutEditAddressLoad
);
user_route.post(
  "/checkoutEditAddress",
  auth.isLogin,
  cartController.checkoutEditAddress
);

//editprofile
user_route.post("/editProfile", auth.isLogin, userController.editProfile);

//forrgetpassword
user_route.get(
  "/forgetPassword",
  auth.isLogout,
  userController.forgetpasswordLoad
);
user_route.post(
  "/forgetPassword",
  auth.isLogout,
  userController.forgetPassword
);
user_route.post(
  "/verifyOtpPassword",
  auth.isLogout,
  userController.verifyOtpPassword
);
user_route.post(
  "/resendotpPassword",
  auth.isLogout,
  userController.resendotpPassword
);
user_route.post(
  "/updatePassword",
  auth.isLogout,
  userController.updatePassword
);

//cash on delivery

user_route.post("/order", auth.isLogin, orderController.order);
user_route.post("/cancelOrder", auth.isLogin, orderController.cancelOrder);
user_route.post(
  "/cancelWholeOrder",
  auth.isLogin,
  orderController.cancelWholeOrder
);
user_route.post("/returnOrder", auth.isLogin, orderController.returnOrder);
user_route.get("/orderDetails", auth.isLogin, orderController.orderDetails);
//razorpay
user_route.post("/razorpay", auth.isLogin, orderController.RazorpayOrder);
user_route.post(
  "/RazorpayOrderRetry",
  auth.isLogin,
  orderController.RazorpayOrderRetry
);

//wishlist
user_route.get("/wishlist", auth.isLogin, wishlistController.wishlistLoad);
user_route.post("/wishlist", auth.isLogin, wishlistController.addWishlist);
user_route.post(
  "/removeProductWishlist",
  auth.isLogin,
  wishlistController.removeProductWishlist
);

//verify signature
user_route.post(
  "/verifySignature",
  auth.isLogin,
  orderController.verifySignature
);
user_route.post(
  "/verifySignatureRetry",
  auth.isLogin,
  orderController.verifySignatureRetry
);

//wallet order
user_route.post("/wallet", auth.isLogin, orderController.walletOrder);

//filter shop
user_route.post("/filter", auth.isLogin, userController.filter);

//sort
user_route.post("/sort", auth.isLogin, userController.sort);

//appply coupon
user_route.post("/applyCoupon", auth.isLogin, couponController.applyCoupon);
user_route.post("/removeCoupon", auth.isLogin, couponController.removeCoupon);

//invoice dowload
user_route.get(
  "/downloadInvoice",
  auth.isLogin,
  orderController.invoiceDowload
);
module.exports = user_route;
