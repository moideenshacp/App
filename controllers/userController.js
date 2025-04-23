// const { name } = require('ejs');
const users = require("../models/userModel");
require("dotenv").config();
const Otp = require("../models/otpModel");
const products = require("../models/product");
const Address = require("../models/address");
const Order = require("../models/order");
const Wallet = require("../models/walletHistory");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const category = require("../models/category");
const Coupon = require("../models/coupon");
const wishlist = require("../models/wishlist");

//to generate otp
function generateOtp() {
  var digits = "1234567890";
  var otp = "";
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

function generateRefferalCode() {
  var digits = "1234567890";
  var Id = "";
  for (let i = 0; i < 6; i++) {
    Id += digits[Math.floor(Math.random() * 10)];
  }
  return Id;
}

//for send otp
const sendOtpMail = async (name, email) => {
  try {
    const otp = generateOtp();

    // Store OTP in the database
    const newOtp = new Otp({
      email: email,
      otp: otp,
      createdAt: new Date(), // Set the current date
      expiredAt: new Date(new Date().getTime() + 1 * 60 * 1000), // Set the expiry time
    });
    await newOtp.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "moideenshacp28@gmail.com",
        pass: "ajsg sggh rewv wqcg",
      },
    });

    const mailOptions = {
      from: "moideenshacp28@gmail.com",
      to: email,
      subject: "OTP Verification",
      html: ` <p>Hi ${name}, please verify this OTP: ${otp}</p>`,
    };
    transporter.sendMail(mailOptions, function (error) {
      if (error) {
        console.log(error.message);
      } else {
        console.log("otp send successfully");
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};
const sendOtpMailPassword = async (email) => {
  try {
    const otp = generateOtp();

    // Store OTP in the database
    const newOtp = new Otp({
      email: email,
      otp: otp,
      createdAt: new Date(), // Set the current date
      expiredAt: new Date(new Date().getTime() + 1 * 60 * 1000), // Set the expiry time
    });
    await newOtp.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "moideenshacp28@gmail.com",
        pass: "ajsg sggh rewv wqcg",
      },
    });

    const mailOptions = {
      from: "moideenshacp28@gmail.com",
      to: email,
      subject: "OTP Verification",
      html: ` <p>Hi, please verify this OTP: ${otp}</p>`,
    };
    transporter.sendMail(mailOptions, function (error) {
      if (error) {
        console.log(error.message);
      } else {
        console.log("otp send successfully");
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

//resend
const resendotp = async (req, res, email) => {
  try {
    // Check if the user exists in the database
    const existingOTP = await Otp.findOne({ email: req.session.email });

    if (existingOTP) {
      await Otp.deleteOne({ email: req.session.email });
      // Generate a new OTP
      await sendOtpMail(req.session.name, req.session.email, userdata._id);
    }
    res.render("otp");
  } catch (error) {
    console.log(error.message);
  }
};

// Function to verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpData = await Otp.findOne({ otp: otp });

    // Check if otp exists
    if (!otpData) {
      return res.render("otp", { messages: " Invalid OTP" });
    }

    // Check if otp has expired
    const currentTime = new Date();
    if (currentTime > otpData.expiredAt) {
      return res.render("otp", { messages: "OTP has expired" });
    }

    // Compare otp
    if (otpData && otpData.otp === otp) {
      const user = new users({
        name: req.session.name,
        email: req.session.email,
        password: req.session.password,
        mobile: req.session.mobile,
        is_admin: 0,
        referralCode: generateRefferalCode(),
      });
      const userDatas = await user.save();

      const checkRefferedPerson = await users.findOne({
        referralCode: req.session.refferal,
      });
      if (checkRefferedPerson) {
        checkRefferedPerson.wallet += 50;
        await checkRefferedPerson.save();
        const transactionReffered = new Wallet({
          user: checkRefferedPerson._id,
          amount: 50,
          type: "credit",
        });
        await transactionReffered.save();
        userDatas.wallet += 20;
        await userDatas.save();
        const transactionUser = new Wallet({
          user: userDatas._id,
          amount: 20,
          type: "credit",
        });
        await transactionUser.save();
      }

      req.session.user_id = null;
      req.session.email = null;
      req.session.name = null;
      req.session.mobile = null;
      req.session.password = null;
      req.session.refferal = null;

      if (userDatas) {
        return res.render("login", {
          message: "registered successfully,Login in now",
        });
      }
    } else {
      return res.render("otp", { messages: "Invalid OTP" });
    }
  } catch (error) {
    return res.render("otp", {
      messages: "An error occurred during OTP verification",
    });
  }
};

//hashpassword
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//for loading loginpage
const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.messege);
  }
};

//for loading signuppage
const SignupHome = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    console.log(error.messege);
  }
};

//for loading Homepage
const loadHome = async (req, res) => {
  try {
    res.render("home");
  } catch (error) {
    console.log(error.messege);
  }
};

//insert user

const insertUser = async (req, res) => {
  try {
    const checkmail = await users.findOne({ email: req.body.email });
    const checkRefferal = await users.findOne({
      referralCode: req.body.refferal,
    });

    if (checkmail) {
      res.render("signup", { messages: "email already exist" });
    } else {
      const spassword = await securePassword(req.body.password);
      const name = req.body.name.trim();
      if (!name || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(name)) {
        return res.render("signup", { messages: "Invalid name provided" });
      }
      if (checkRefferal) {
        console.log("we got refferal person");
      } else {
        return res.render("signup", {
          messages: "Invalid ReferralCode provided",
        });
      }
      const email = req.body.email;
      const emailRegex = /^[A-Za-z0-9.%+-]+@gmail\.com$/;
      const hasLowerCase = /[a-z]/;
      const hasUpperCase = /[A-Z]/;
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
      if (
        !req.body.password ||
        !hasLowerCase.test(req.body.password) ||
        !hasUpperCase.test(req.body.password) ||
        !hasSpecialChar.test(req.body.password)
      ) {
        return res.render("signup", {
          messages:
            "Password must contain at least one lowercase letter, one uppercase letter, and one special character",
        });
      }

      const mobile = req.body.mobile;
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(mobile)) {
        return res.render("signup", { messages: "invalid mobilenumber" });
      }

      // Check if the email is valid
      if (!emailRegex.test(email)) {
        return res.render("signup", { messages: "Invalid email provided" });
      }

      const user = new users({
        name: req.body.name,
        email: req.body.email,
        password: spassword,
        mobile: req.body.mobile,
        is_admin: 0,
      });

      userdata = await user;
      req.session.user_id = userdata._id;
      req.session.email = userdata.email;
      req.session.name = userdata.name;
      req.session.mobile = req.body.mobile;
      (req.session.password = userdata.password),
        (req.session.refferal = req.body.refferal);

      if (userdata) {
        await sendOtpMail(req.body.name, req.body.email);
        res.render("otp", {
          messages: "Check your email for the OTP and enter it below",
        });
      } else {
        res.render("signup", { messages: "failed to register" });
      }
    }
  } catch (error) {
    console.log(error.messege);
  }
};
//google user

const googleInsert = async (req, res) => {
  try {
    const email = req.user.emails[0].value;
    const name = req.user.displayName;

    const checkEmail = await users.findOne({ email: email });
    if (checkEmail) {
      req.session.user_id = checkEmail._id;
      res.redirect("/home");
    } else {
      const googleuser = new users({
        name: name,
        email: email,
      });

      const usergoogle = await googleuser.save();
      if (usergoogle) {
        req.session.user_id = usergoogle._id;
        res.redirect("/home");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

//failure login
const failureLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

//verify login

const verify = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await users.findOne({ email: email });

    if (userData) {
      if (userData.is_blocked === false) {
        const passwordMatch = await bcrypt.compare(password, userData.password);
        if (passwordMatch) {
          req.session.user_id = userData._id;

          res.redirect("/home");
        } else {
          res.render("login", { messages: "incorrect email or password" });
        }
      } else {
        res.render("login", { messages: "Access Restricted" });
      }
    } else {
      res.render("login", { messages: "Email and Password is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//load otppage

const loadOtp = async (req, res) => {
  try {
    res.render("otp");
  } catch (error) {
    console.log(error.message);
  }
};

//load userhome
const userhome = async (req, res) => {
  try {
    const productData = await products.find({}).populate("category");
    res.render("userhome", { productData });
  } catch (error) {
    console.log(error.message);
  }
};

//load profile
const loadprofile = async (req, res) => {
  try {
    const user = await users.find({ _id: req.session.user_id });
    const address = await Address.findOne({ user: req.session.user_id });

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const orderPoducts = await Order.find({ user: req.session.user_id })
      .populate({
        path: "products.product",
        populate: {
          path: "category",
        },
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    const totalOrders = await Order.countDocuments({
      user: req.session.user_id,
    });
    const orderAddress = await Order.findOne().populate("address");
    const couponView = await Coupon.find();
    let activeTab = req.query.tab || "dashboard";

    res.render("profile", {
      address,
      user,
      orderPoducts,
      couponView,
      totalOrders,
      currentPage: page,
      pages: Math.ceil(totalOrders / limit),
      activeTab,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const wallet = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const transactions = await Wallet.find({ user: userId })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalItems = await Wallet.countDocuments({ user: userId });

    res
      .status(200)
      .json({
        success: true,
        transactions,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        totalItems,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch wallet history" });
  }
};

////load product
const loadproduct = async (req, res) => {
  try {
    res.render("product");
  } catch (error) {
    console.log(error.message);
  }
};

//load product
const productDetail = async (req, res) => {
  try {
    const id = req.query.id;
    const wishlistData = await wishlist.find({ user: req.session.user_id });

    const productData = await products
      .findById({ _id: id })
      .populate("category");
    const productDatas = await products.find({});
    const relatedProducts = await products
      .find({ category: productData.category })
      .populate("category");
    res.render("productDetail", {
      productData,
      productDatas,
      relatedProducts,
      wishlistData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//load shop

const shop = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search;

    let productData;
    let categoryData;
    const wishlistData = await wishlist.find({ user: req.session.user_id });

    if (searchQuery) {
      productData = await products
        .find({
          $or: [{ name: { $regex: ".*" + searchQuery + ".*", $options: "i" } }],
        })
        .populate("category")
        .skip(skip)
        .limit(limit);
    } else {
      productData = await products
        .find({})
        .populate("category")
        .skip(skip)
        .limit(limit);
    }
    const totalProducts = await products.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    categoryData = await category.find();
    res.render("shop", {
      productData,
      wishlistData,
      categoryData,
      currentPage: page,
      totalPages,
      limit,
    });
  } catch (error) {
    console.log(error);
  }
};

//load cart

const cartLoad = async (req, res) => {
  try {
    res.render("cart");
  } catch (error) {
    console.log(error);
  }
};

//load newAdress
const loadNewAdress = async (req, res) => {
  try {
    res.render("addAdress");
  } catch (error) {
    console.log(error);
  }
};

//add address
const addAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userAddress = await Address.findOne({ user: userId });
    if (!userAddress) {
      const name = req.body.name.trim();
      const address = req.body.address.trim();
      const city = req.body.city.trim();
      const state = req.body.state.trim();
      const pincode = req.body.pincode.trim();
      const phone = req.body.phone.trim();
      const email = req.body.email.trim();
      if (!name || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(name)) {
        return res.render("addAdress", {
          messages: "Invalid name provided",
          name,
          address,
          city,
          state,
          pincode,
          phone,
          email,
        });
      }
      if (!address) {
        return res.render("addAdress", {
          messages: "Invalid address provided",
          name,
          address,
          city,
          state,
          pincode,
          phone,
          email,
        });
      }
      if (!city || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(city)) {
        return res.render("addAdress", {
          messages: "Invalid city provided",
          name,
          address,
          city,
          state,
          pincode,
          phone,
          email,
        });
      }
      if (!state || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(state)) {
        return res.render("addAdress", {
          messages: "Invalid state provided",
          name,
          address,
          city,
          state,
          pincode,
          phone,
          email,
        });
      }
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(phone)) {
        return res.render("addAdress", {
          messages: "invalid mobilenumber",
          name,
          address,
          city,
          state,
          pincode,
          phone,
          email,
        });
      }
      const pincodeRegex = /^\d{6}$/;
      if (!pincodeRegex.test(pincode)) {
        return res.render("addAdress", {
          messages: "invalid pincode,pincode must be 6 digits",
          name,
          address,
          city,
          state,
          pincode,
          phone,
          email,
        });
      }
      const emailRegex = /^[A-Za-z0-9.%+-]+@gmail\.com$/;
      if (!emailRegex.test(email)) {
        return res.render("addAdress", {
          messages: "invalid email provided",
          name,
          address,
          city,
          state,
          pincode,
          phone,
          email,
        });
      }

      const addressAdd = new Address({
        user: userId,
        addresses: [
          {
            name: name,
            address: address,
            city: city,
            state: state,
            pincode: pincode,
            phone: phone,
            email: email,
          },
        ],
      });
      await addressAdd.save();
    } else {
      const name = req.body.name.trim();
      const address = req.body.address.trim();
      const city = req.body.city.trim();
      const state = req.body.state.trim();
      const pincode = req.body.pincode.trim();
      const phone = req.body.phone.trim();
      const email = req.body.email.trim();
      if (!name || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(name)) {
        return res.render("addAdress", {
          messages: "Invalid name provided",
          name,
          address,
          city,
          state,
          pincode,
          phone,
          email,
        });
      }
      if (!address) {
        return res.render("addAdress", {
          messages: "Invalid address provided",
          name,
          address,
          city,
          state,
          pincode,
          phone,
          email,
        });
      }
      if (!city || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(city)) {
        return res.render("addAdress", {
          messages: "Invalid city provided",
          name,
          address,
          city,
          state,
          pincode,
          phone,
          email,
        });
      }
      if (!state || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(state)) {
        return res.render("addAdress", {
          messages: "Invalid state provided",
          name,
          address,
          city,
          state,
          pincode,
          phone,
          email,
        });
      }
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(phone)) {
        return res.render("addAdress", {
          messages: "invalid mobilenumber",
          name,
          address,
          city,
          state,
          pincode,
          phone,
          email,
        });
      }
      const pincodeRegex = /^\d{6}$/;
      if (!pincodeRegex.test(pincode)) {
        return res.render("addAdress", {
          messages: "invalid pincode,pincode must be 6 digits",
          name,
          address,
          city,
          state,
          pincode,
          phone,
          email,
        });
      }
      const emailRegex = /^[A-Za-z0-9.%+-]+@gmail\.com$/;
      if (!emailRegex.test(email)) {
        return res.render("addAdress", {
          messages: "invalid email provided",
          name,
          address,
          city,
          state,
          pincode,
          phone,
          email,
        });
      }

      userAddress.addresses.push({
        name: name,
        address: address,
        city: city,
        state: state,
        pincode: pincode,
        phone: phone,
        email: email,
      });
      await userAddress.save();
    }

    res.redirect("/profile");
  } catch (error) {
    console.log(error);
  }
};
const removeAddress = async (req, res) => {
  try {
    const addressId = req.body.addressId;
    const addressData = await Address.findOne({ user: req.session.user_id });
    const index = addressData.addresses.find(
      (value) => value._id.toString() === addressId
    );
    if (index) {
      addressData.addresses.splice(index, 1);
      await addressData.save();
    }

    res.status(200).json({ message: "succes" });
  } catch (error) {
    console.log(error);
  }
};

//edit address load
const loadEditAddress = async (req, res) => {
  try {
    const addressId = req.query.id;
    const addressData = await Address.findOne({ user: req.session.user_id });
    const index = addressData.addresses.find(
      (value) => value._id.toString() === addressId
    );
    if (index) {
      res.render("editAddress", { index });
    }
  } catch (error) {
    console.log(error);
  }
};

const updateAddress = async (req, res) => {
  try {
    const { name, address, city, pincode, state, phone, email, addressId } =
      req.body;

    const addressData = await Address.findOne({ user: req.session.user_id });
    const got = await Address.findOne({ "addresses._id": addressId });
    const updateAddress = await Address.findOneAndUpdate(
      {
        "addresses._id": addressId,
      },
      {
        $set: {
          "addresses.$.name": name,
          "addresses.$.address": address,
          "addresses.$.city": city,
          "addresses.$.pincode": pincode,
          "addresses.$.state": state,
          "addresses.$.phone": phone,
          "addresses.$.email": email,
        },
      }
    );
    res.status(200).json({ message: "success" });
  } catch (error) {
    console.log(error);
  }
};

//edit profile

const editProfile = async (req, res) => {
  try {
    const { name, email, mobile, userId } = req.body;
    const existingProfile = await users.findOne({ email: email });

    const editProfile = await users.findByIdAndUpdate(
      { _id: req.body.userId },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
        },
      }
    );
    res.status(200).json({ message: "success" });
  } catch (error) {
    console.log(error);
  }
};

const forgetpasswordLoad = async (req, res) => {
  try {
    res.render("forgetPassword");
  } catch (error) {
    console.log(error);
  }
};
const forgetPassword = async (req, res) => {
  try {
    const checkmail = await users.findOne({ email: req.body.email });
    if (checkmail) {
      await sendOtpMailPassword(req.body.email);
      req.session.user_email = req.body.email;

      res.render("otpPassword", {
        messages: "Check your email for the OTP and enter it below",
      });
    } else {
      res.render("forgetPassword", {
        messages: "This email is not Registered yet,please Register First",
      });
    }
  } catch (error) {
    console.log(error);
  }
};
const verifyOtpPassword = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpData = await Otp.findOne({ otp: otp });

    if (!otpData) {
      return res.render("otpPassword", { messages: " Invalid OTP" });
    }

    // Check if otp has expired
    const currentTime = new Date();
    if (currentTime > otpData.expiredAt) {
      return res.render("otpPassword", { messages: "OTP has expired" });
    }

    // Compare otp
    if (otpData && otpData.otp === otp) {
      const userMail = req.session.user_email;
      res.render("forgetPasswordEnter");
    }
  } catch (error) {
    return res.render("otpPassword", {
      messages: "An error occurred during OTP verification",
    });
  }
};
const updatePassword = async (req, res) => {
  try {
    const password = req.body.password;
    const spassword = await securePassword(req.body.password);
    const hasLowerCase = /[a-z]/;
    const hasUpperCase = /[A-Z]/;
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (
      !req.body.password ||
      !hasLowerCase.test(req.body.password) ||
      !hasUpperCase.test(req.body.password) ||
      !hasSpecialChar.test(req.body.password)
    ) {
      return res.render("forgetPasswordEnter", {
        messages:
          "Password must contain at least one lowercase letter, one uppercase letter, and one special character",
      });
    }

    const checkmail = await users.findOne({ email: req.session.user_email });
    const update = await users.findOneAndUpdate(
      { email: req.session.user_email },
      { password: spassword }
    );
    if (update) {
      res.render("login", {
        message:
          "Password updated successfully. Please login with your new password.",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const resendotpPassword = async (req, res, email) => {
  try {
    const existingOTP = await Otp.findOne({ email: req.session.user_email });

    if (existingOTP) {
      await Otp.deleteOne({ email: req.session.user_email });
      await sendOtpMailPassword(req.session.user_email);
    }
    res.render("otpPassword");
  } catch (error) {
    console.log(error.message);
  }
};

//signout
const signout = async (req, res) => {
  try {
    req.session.user_id = null;
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

const filter = async (req, res) => {
  try {
    const { selectedCategory, priceRange } = req.body;

    let query = {};

    if (selectedCategory && selectedCategory.length > 0) {
      const categories = await category.find({
        name: { $in: selectedCategory },
      });
      const categoryIds = categories.map((category) => category._id);
      query.category = { $in: categoryIds };
    }

    if (priceRange && priceRange.length === 2) {
      const [minPrice, maxPrice] = priceRange;
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        query.price = { $gte: minPrice, $lte: maxPrice };
      }
    }
    const categoryData = await category.find();

    const productData = await products.find(query).populate("category");

    res.status(200).json({ message: "success", productData, categoryData });
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

const sort = async (req, res) => {
  try {
    const { selectedValue } = req.body;
    const productData = await products.find().populate("category");
    const categoryData = await category.find();

    if (selectedValue == "lowtohigh") {
      productData.sort((a, b) => a.price - b.price);
    } else if (selectedValue == "hightolow") {
      productData.sort((a, b) => b.price - a.price);
    } else if (selectedValue == "newarrivals") {
      productData.sort((a, b) => b.createdAt - a.createdAt);
    } else if (selectedValue == "aA-zZ") {
      productData.sort((a, b) => a.name.localeCompare(b.name));
    } else if (selectedValue == "zZ-aA") {
      productData.sort((a, b) => b.name.localeCompare(a.name));
    } else if (selectedValue == "popularity") {
      productData.sort((a, b) => b.sales - a.sales);
    }
    res.status(200).json({ message: "success", productData, categoryData });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadHome,
  loadLogin,
  insertUser,
  verify,
  loadOtp,
  SignupHome,
  verifyOtp,
  loadprofile,
  wallet,
  userhome,
  signout,
  resendotp,
  loadproduct,
  googleInsert,
  failureLogin,
  productDetail,
  shop,
  cartLoad,
  //user adress*******************************
  loadNewAdress,
  addAddress,
  removeAddress,
  loadEditAddress,
  updateAddress,
  //edit profile===================
  editProfile,
  //foret password
  forgetpasswordLoad,
  forgetPassword,
  verifyOtpPassword,
  resendotpPassword,
  updatePassword,
  //sort  filter=================
  filter,
  sort,
};
