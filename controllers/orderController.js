const users = require("../models/userModel");
const Cart = require("../models/cart");
const product = require("../models/product");
const Address = require("../models/address");
const Order = require("../models/order");
const Wallet = require("../models/walletHistory");
const easyinvoice = require("easyinvoice");
const fs = require("fs");
const path = require("path");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();
var {
  validatePaymentVerification,
} = require("razorpay/dist/utils/razorpay-utils");


function genrateOrderID() {
  var digits = "1234567890";
  var Id = "";
  for (let i = 0; i < 6; i++) {
    Id += digits[Math.floor(Math.random() * 10)];
  }
  return Id;
}

const RAZORPAY_ID_KEY = process.env.RAZORPAY_ID_KEY;
const RAZORPAY_SECRET_KEY = process.env.RAZORPAY_SECRET_KEY;

var razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

const order = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await users.findOne({ _id: userId });
    const { selectedAddress, paymentMethod, subtotal } = req.body;
    const productData = await Cart.findOne({ user: userId }).populate(
      "products.product"
    );
    const length = productData.products.length;

    for (let i = 0; i < productData.products.length; i++) {
      const productId = productData.products[i].product._id;
      const quantities = productData.products[i].quantity;
      const productFinding = await product.findById(productId);

      if (!productFinding || productFinding.quantity < quantities) {
        return res
          .status(200)
          .json({
            fail: `Product ${productData.products[i].product.name} is out of stock`,
          });
      }
    }

    for (i = 0; i < length; i++) {
      const productId = productData.products[i].product._id;
      const quantities = productData.products[i].quantity;

      const productcheck = await product.findByIdAndUpdate(
        { _id: productId },
        { $inc: { quantity: -quantities, sales: quantities } }
      );
    }
    const totalAmount = parseFloat(subtotal.replace(/[^\d.-]/g, ""));

    const order = new Order({
      orderId: genrateOrderID(),
      user: userId,
      products: productData.products,
      paymentMethod: paymentMethod,
      address: selectedAddress,
      date: Date.now(),
      totalAmount: totalAmount,
    });

    await order.save();
    await Cart.deleteOne({ user: userId });

    res.status(200).json({ message: "success" });
  } catch (error) {
    console.log(error);
  }
};

const loadOrderSuccess = async (req, res) => {
  try {
    res.render("orderSuccess");
  } catch (error) {
    console.log(error);
  }
};
const loadOrderFailure = async (req, res) => {
  try {
    res.render("orderFailure");
  } catch (error) {
    console.log(error);
  }
};
const walletOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await users.findOne({ _id: userId });
    const { selectedAddress, paymentMethod, subtotal } = req.body;
    const productData = await Cart.findOne({ user: userId }).populate(
      "products.product"
    );

    if (!productData || !productData.products.length) {
      return res.status(400).json({ error: "No products found in cart" });
    }

    const length = productData.products.length;
    for (let i = 0; i < productData.products.length; i++) {
      const productId = productData.products[i].product._id;
      const quantities = productData.products[i].quantity;
      const productFinding = await product.findById(productId);

      if (!productFinding || productFinding.quantity < quantities) {
        return res
          .status(200)
          .json({
            failure: `Product ${productData.products[i].product.name} is out of stock`,
          });
      }
    }

    for (let i = 0; i < length; i++) {
      const productId = productData.products[i].product._id;
      const quantities = productData.products[i].quantity;

      const productCheck = await product.findByIdAndUpdate(
        { _id: productId },
        { $inc: { quantity: -quantities, sales: quantities } }
      );

      if (!productCheck) {
        return res
          .status(500)
          .json({ error: "Error updating product quantity" });
      }
    }

    if (userData.wallet >= subtotal) {
      userData.wallet -= subtotal;
      await userData.save();

      const transaction = new Wallet({
        user: userId,
        amount: -subtotal,
        type: "debit",
      });
      await transaction.save();

      const order = new Order({
        orderId: genrateOrderID(),
        user: userId,
        products: productData.products,
        paymentMethod: paymentMethod,
        address: selectedAddress,
        date: Date.now(),
        totalAmount: subtotal,
      });

      const savedOrder = await order.save();
      if (!savedOrder) {
        throw new Error("Order could not be saved");
      }

      const cartDeletion = await Cart.deleteOne({ user: userId });
      if (!cartDeletion) {
        throw new Error("Error clearing cart");
      }

      return res.status(200).json({ message: "success" });
    } else {
      return res.status(200).json({ fail: "payment failed" });
    }
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const RazorpayOrder = async (req, res) => {
  try {
    const { subtotal, selectedAddress } = req.body;
    const userId = req.session.user_id;
    const productData = await Cart.findOne({ user: userId }).populate(
      "products.product"
    );

    for (let i = 0; i < productData.products.length; i++) {
      const productId = productData.products[i].product._id;
      const quantities = productData.products[i].quantity;
      const productFinding = await product.findById(productId);

      if (!productFinding || productFinding.quantity < quantities) {
        return res
          .status(200)
          .json({
            failure: true,
            msg: `Product ${productData.products[i].product.name} is out of stock`,
          });
      }
    }
    const amount = subtotal * 100;

    const options = {
      amount: amount,
      currency: "INR",
      receipt: "moideenshacp28@gmail.com",
    };

    razorpayInstance.orders.create(options, async (err, order) => {
      if (!err) {
        const userId = req.session.user_id;
        const userData = await users.findOne({ _id: userId });
        const productData = await Cart.findOne({ user: userId }).populate(
          "products.product"
        );

        const orderData = new Order({
          orderId: genrateOrderID(),
          user: userId,
          products: productData.products.map((product) => ({
            product: product.product._id,
            quantity: product.quantity,
            total: product.total,
            status: "payment failed",
          })),
          paymentMethod: "Razorpay",
          address: selectedAddress,
          date: Date.now(),
          totalAmount: subtotal,
          razorpayOrderId: order.id,
          paymentStatus: "payment failed",
        });

        await orderData.save();
        await Cart.deleteOne({ user: userId });

        res.status(200).json({
          success: true,
          msg: "Order Created",
          order_id: order.id,
          amount: amount,
          key_id: RAZORPAY_ID_KEY,
          contact: "9846648631",
          name: "Moideensha cp",
          email: "moideenshacp28@gmail.com",
        });
      } else {
        res.status(400).json({ success: false, msg: "Something went wrong!" });
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const verifySignature = async (req, res) => {
  try {
    const { requestData } = req.body;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      selectedAddress,
      paymentMethod,
      subtotal,
    } = requestData;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      const userId = req.session.user_id;
      const userData = await users.findOne({ _id: userId });
      const productData = await Order.findOne({
        razorpayOrderId: razorpay_order_id,
      }).populate("products.product");
      const length = productData.products.length;

      for (i = 0; i < length; i++) {
        const productId = productData.products[i].product._id;
        const quantities = productData.products[i].quantity;
        const productFinding = await product.findById(productId);
        if (!productFinding || productFinding.quantity < quantities) {
          return res
            .status(400)
            .json({
              failure: true,
              msg: `Product ${productData.products[i].product.name} is out of stock`,
            });
        }

        const productcheck = await product.findByIdAndUpdate(
          { _id: productId },
          { $inc: { quantity: -quantities, sales: quantities } }
        );
      }

      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          $set: {
            products: productData.products.map((product) => ({
              product: product.product._id,
              quantity: product.quantity,
              total: product.total,
              status: "Order confirmed",
            })),
            paymentMethod: paymentMethod,
            address: selectedAddress,
            totalAmount: subtotal,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paymentStatus: "payment success",
            date: Date.now(),
          },
        },
        { new: true }
      );

      await order.save();
      await Cart.deleteOne({ user: userId });

      res
        .status(200)
        .json({
          success: true,
          message: "Signature verified and order created successfully",
        });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const RazorpayOrderRetry = async (req, res) => {
  try {
    const { subtotal } = req.body;

    const amount = subtotal * 100;
    const options = {
      amount: amount,
      currency: "INR",
      receipt: "moideenshacp28@gmail.com",
    };
    razorpayInstance.orders.create(options, async (err, order) => {
      if (!err) {
        res.status(200).json({
          success: true,
          msg: "Order Created",
          order_id: order.id,
          amount: amount,
          key_id: RAZORPAY_ID_KEY,
          contact: "9846648631",
          name: "Moideensha cp",
          email: "moideenshacp28@gmail.com",
        });
      } else {
        res.status(400).json({ success: false, msg: "Something went wrong!" });
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};
const verifySignatureRetry = async (req, res) => {
  try {
    const { requestData } = req.body;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    } = requestData;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      const userId = req.session.user_id;
      const userData = await users.findOne({ _id: userId });
      const productData = await Order.findOne({ orderId: order_id }).populate(
        "products.product"
      );
      const length = productData.products.length;

      for (i = 0; i < length; i++) {
        const productId = productData.products[i].product._id;
        const quantities = productData.products[i].quantity;

        const productcheck = await product.findByIdAndUpdate(
          { _id: productId },
          { $inc: { quantity: -quantities, sales: quantities } }
        );
      }

      const order = await Order.findOneAndUpdate(
        { orderId: order_id },
        {
          $set: {
            products: productData.products.map((product) => ({
              product: product.product._id,
              quantity: product.quantity,
              total: product.total,
              status: "Order confirmed",
            })),
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paymentStatus: "payment success",
            date: Date.now(),
          },
        },
        { new: true }
      );

      await order.save();
      await Cart.deleteOne({ user: userId });

      res
        .status(200)
        .json({
          success: true,
          message: "Signature verified and order created successfully",
        });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId, productId } = req.body;
    const userId = req.session.user_id;

    // Find the order that contains this product
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      "products.product": productId,
    });

    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found for this product" });
    }

    // Find the product in the order
    const orderProductIndex = order.products.findIndex(
      (p) => p.product.toString() === productId
    );
    if (orderProductIndex === -1) {
      return res
        .status(404)
        .json({ message: "Product not found in the order" });
    }

    const orderProduct = order.products[orderProductIndex];

    // Mark the product as cancelled
    order.products[orderProductIndex].status = "cancelled";
    await order.save();

    // Update product stock & sales
    const productData = await product.findById(productId);
    if (!productData) {
      return res.status(404).json({ message: "Product not found" });
    }

    productData.quantity += orderProduct.quantity;
    productData.sales -= orderProduct.quantity;
    await productData.save();

    // Process refund if payment was Razorpay or Wallet
    if (["Razorpay", "Wallet"].includes(order.paymentMethod)) {
      const user = await users.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let refundAmount = 0;
      const productCart = await product
        .findById(productId)
        .populate("category");

      if (productCart) {
        const { offerprice, price, category } = productCart;
        if (offerprice > 0 && category.offerprice > 0) {
          refundAmount =
            (offerprice - (offerprice * category.offerprice) / 100) *
            orderProduct.quantity;
        } else if (offerprice > 0) {
          refundAmount = offerprice * orderProduct.quantity;
        } else if (category.offerprice > 0) {
          refundAmount =
            (price - (price * category.offerprice) / 100) *
            orderProduct.quantity;
        } else {
          refundAmount = price * orderProduct.quantity;
        }
      }

      // Credit refund to wallet
      user.wallet += refundAmount;
      await user.save();

      // Save wallet transaction
      await new Wallet({
        user: userId,
        amount: refundAmount,
        type: "credit",
      }).save();
    }

    return res.status(200).json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const cancelWholeOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.session.user_id;

    // Find the order
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Mark all products as cancelled
    order.products.forEach((product) => {
      product.status = "cancelled";
    });

    await order.save();

    // Update stock & sales for each product
    for (const orderProduct of order.products) {
      const productData = await product.findById(orderProduct.product);
      if (productData) {
        productData.quantity += orderProduct.quantity;
        productData.sales -= orderProduct.quantity;
        await productData.save();
      }
    }

    // Process refund if payment was Razorpay or Wallet
    if (["Razorpay", "Wallet"].includes(order.paymentMethod)) {
      const user = await users.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let totalRefundAmount = 0;

      for (const orderProduct of order.products) {
        const productCart = await product
          .findById(orderProduct.product)
          .populate("category");

        if (productCart) {
          const { offerprice, price, category } = productCart;
          let refundAmount = 0;

          if (offerprice > 0 && category.offerprice > 0) {
            refundAmount =
              (offerprice - (offerprice * category.offerprice) / 100) *
              orderProduct.quantity;
          } else if (offerprice > 0) {
            refundAmount = offerprice * orderProduct.quantity;
          } else if (category.offerprice > 0) {
            refundAmount =
              (price - (price * category.offerprice) / 100) *
              orderProduct.quantity;
          } else {
            refundAmount = price * orderProduct.quantity;
          }

          totalRefundAmount += refundAmount;
        }
      }

      // Credit total refund to wallet
      user.wallet += totalRefundAmount;
      await user.save();

      // Save wallet transaction
      await new Wallet({
        user: userId,
        amount: totalRefundAmount,
        type: "credit",
      }).save();
    }

    return res.status(200).json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling whole order:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const returnOrder = async (req, res) => {
  try {
    const { orderId, productId, reason } = req.body;
    const userId = req.session.user_id;

    // Find the exact order containing the product
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      "products.product": productId,
    });

    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found for this product" });
    }

    // Find the product in the order
    const orderProductIndex = order.products.findIndex(
      (p) => p.product.toString() === productId
    );
    if (orderProductIndex === -1) {
      return res
        .status(404)
        .json({ message: "Product not found in the order" });
    }

    // Update order status and save return reason
    order.products[orderProductIndex].status = "Return request sended";
    order.products[orderProductIndex].returnReason = reason;
    await order.save();

    return res
      .status(200)
      .json({ message: "Return request submitted successfully" });
  } catch (error) {
    console.error("Error processing return request:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const orderDetails = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.query.productId;
    const orderId = req.query.orderId;
    const orderData = await Order.findOne({ _id: orderId }).populate(
      "address.addresses"
    );
    const orders = await Order.find({ user: userId }).populate({
      path: "products.product",
      populate: {
        path: "category",
      },
    });
    const address = await Address.findOne({ user: userId });
    let orderProduct = null;
    orders.forEach((order) => {
      order.products.forEach((product) => {
        if (product.product._id.toString() === productId) {
          orderProduct = product;
        }
      });
    });
    let orderAddress = null;
    address.addresses.forEach((add) => {
      if (add._id.toString() === orderData.address.toString()) {
        orderAddress = add;
      }
    });
    const formattedDate = orderData.date.toLocaleString("en-US", {
      timeZone: "UTC",
    });

    res.render("orderDetails", {
      orderProduct,
      orders,
      orderData,
      formattedDate,
      orderAddress,
    });
  } catch (error) {
    console.log(error);
  }
};

const invoiceDowload = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.query.productId;
    const orderId = req.query.orderId;
    const orderData = await Order.findOne({ _id: orderId })
      .populate("address.addresses")
      .populate({
        path: "products.product",
        populate: {
          path: "category",
        },
      });
    const address = await Address.findOne({ user: userId });
    let orderAddress = null;
    address.addresses.forEach((add) => {
      if (add._id.toString() === orderData.address.toString()) {
        orderAddress = add;
      }
    });
    const deliveredProducts = orderData.products.filter(
      (orderProduct) =>
        orderProduct.status === "delivered" ||
        orderProduct.status === "Return Denied"
    );
    if (deliveredProducts.length === 0) {
      return res
        .status(400)
        .json({ message: "No delivered product available for this order" });
    }

    const calculatePrice = (orderProduct) => {
      const product = orderProduct.product;
      const category = product.category;

      if (product.offerprice > 0 && category.offerprice > 0) {
        return Math.round(
          product.offerprice - (product.offerprice * category.offerprice) / 100
        );
      } else if (product.offerprice > 0) {
        return product.offerprice;
      } else if (category.offerprice > 0) {
        return Math.round(
          product.price - (product.price * category.offerprice) / 100
        );
      } else {
        return product.price;
      }
    };
    const data = {
      currency: "INR",
      taxNotation: "gst", // or "vat"
      marginTop: 25,
      marginRight: 25,
      marginLeft: 25,
      marginBottom: 25,
      logo: "https://public.easyinvoice.cloud/img/logo_en_original.png", // Your logo URL
      background: "https://public.easyinvoice.cloud/img/watermark-draft.jpg", // Your background image URL
      sender: {
        company: "Mars -eCommerce",
        zip: "676366",
        city: "malappuram",
        country: "India",
      },
      client: {
        company: orderAddress.name,
        address: orderAddress.address,
        zip: orderAddress.pincode,
        city: orderAddress.city,
        state: orderAddress.state,
      },
      invoiceNumber: orderId,
      invoiceDate: new Date(order.date).toLocaleDateString(),
      products: deliveredProducts.map((orderProduct) => ({
        quantity: orderProduct.quantity,
        description: orderProduct.product.name,
        tax: 0, // Assuming no tax for simplicity
        price: calculatePrice(orderProduct),
      })),
      bottomNotice: "Thank you for your purchase!",
    };

    // Generate invoice
    const result = await easyinvoice.createInvoice(data);
    const invoicesDir = path.join(__dirname, "../invoices");
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir);
    }
    const invoicePath = path.join(invoicesDir, `invoice-${orderId}.pdf`);
    fs.writeFileSync(invoicePath, result.pdf, "base64");

    // Send the file to the client for download
    res.download(invoicePath, `invoice-${orderId}.pdf`, (err) => {
      if (err) {
        console.error(err);
      } else {
        fs.unlinkSync(invoicePath);
      }
    });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  order,
  cancelOrder,
  cancelWholeOrder,
  loadOrderFailure,
  loadOrderSuccess,
  orderDetails,
  RazorpayOrder,
  verifySignature,
  walletOrder,
  returnOrder,
  //invoice dowload=============================
  invoiceDowload,
  //retry payment
  RazorpayOrderRetry,
  verifySignatureRetry,

};
