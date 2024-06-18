
const users = require('../models/userModel');
const categories =  require('../models/category')
const Cart = require('../models/cart');
const product = require('../models/product');
const Address = require('../models/address');
const Order = require('../models/order');
const Wallet = require('../models/walletHistory')
const Razorpay = require('razorpay');
const { logout } = require('./adminController');
const crypto = require('crypto');
require('dotenv').config();
var {
    validatePaymentVerification,
  } = require("razorpay/dist/utils/razorpay-utils");
const { fail } = require('assert');
const { wallet } = require('./userController');




const RAZORPAY_ID_KEY = process.env.RAZORPAY_ID_KEY;
const RAZORPAY_SECRET_KEY = process.env.RAZORPAY_SECRET_KEY;

var razorpayInstance = new Razorpay({
    key_id:RAZORPAY_ID_KEY,
    key_secret:RAZORPAY_SECRET_KEY,
  });


const order = async(req,res)=>{
    try {
        const userId = req.session.user_id;
        const userData = await users.findOne({_id:userId})
        const { selectedAddress,paymentMethod,subtotal} = req.body;
        const productData = await Cart.findOne({user:userId}).populate('products.product')
        const length = productData.products.length;

        for(i=0;i<length;i++){
            const productId = productData.products[i].product._id
            const quantities = productData.products[i].quantity;
            
            const productcheck = await product.findByIdAndUpdate({_id:productId},{$inc:{quantity:-quantities,sales:quantities}})
        }
       
        const order = new Order({
            user:userId,
            products:productData.products,
            paymentMethod:paymentMethod,
            address:selectedAddress,
            date:Date.now(),
            totalAmount:subtotal

        })
        
        await order.save()
        await Cart.deleteOne({ user: userId });

        res.status(200).json({message:'success'})


    } catch (error) {
        console.log(error);
    }
}
const walletOrder = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const userData = await users.findOne({ _id: userId });
        const { selectedAddress, paymentMethod, subtotal } = req.body;
        const productData = await Cart.findOne({ user: userId }).populate('products.product');
        
        if (!productData || !productData.products.length) {
            return res.status(400).json({ error: "No products found in cart" });
        }

        const length = productData.products.length;

        for (let i = 0; i < length; i++) {
            const productId = productData.products[i].product._id;
            const quantities = productData.products[i].quantity;
            
            const productCheck = await product.findByIdAndUpdate(
                { _id: productId },
                { $inc: { quantity: -quantities ,sales:quantities} }
            );

            if (!productCheck) {
                return res.status(500).json({ error: "Error updating product quantity" });
            }
        }

        if (userData.wallet >= subtotal) {
            userData.wallet -= subtotal;
            await userData.save();


            const transaction = new Wallet({
                user: userId,
                amount: -subtotal,
                type: 'debit',
                
            });
            await transaction.save();

            const order = new Order({
                user: userId,
                products: productData.products,
                paymentMethod: paymentMethod,
                address: selectedAddress,
                date: Date.now(),
                totalAmount: subtotal
            });

            const savedOrder = await order.save();
            if (!savedOrder) {
                throw new Error("Order could not be saved");
            }

            const cartDeletion = await Cart.deleteOne({ user: userId });
            if (!cartDeletion) {
                throw new Error("Error clearing cart");
            }

            return res.status(200).json({ message: 'success' });
        } else {
            return res.status(200).json({fail: "payment failed"});
        }

    } catch (error) {
        console.error("Error placing order:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const RazorpayOrder = async (req,res)=>{
    try {
        const {subtotal} = req.body
        console.log("we get innn");
        const amount = subtotal * 100;
        console.log(subtotal);
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: 'moideenshacp28@gmail.com'
        }
        razorpayInstance.orders.create(options,(err,order) => {
                if(!err){
                    res.status(200).json({
                        success:true,
                        msg:'Order Created',
                        order_id:order.id,
                        amount:amount,
                        key_id: RAZORPAY_ID_KEY,
                        contact:"9846648631",
                        name: "Moideensha cp",
                        email: "moideenshacp28@gmail.com",
                    });
                }
                else{
                    console.log(err);
                    res.status(400).json({success:false,msg:'Something went wrong!'});
                }
            }
        );

    } catch (error) {
        console.log(error.message);
    }
}



const verifySignature = async (req, res) => {
    try {
        const { requestData } = req.body;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature,selectedAddress,paymentMethod,subtotal } = requestData;

        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            console.log("Payment is successful");

            const userId = req.session.user_id;
            const userData = await users.findOne({_id:userId})
            const productData = await Cart.findOne({user:userId}).populate('products.product')
            const length = productData.products.length;
    
            for(i=0;i<length;i++){
                const productId = productData.products[i].product._id
                const quantities = productData.products[i].quantity;
                
                const productcheck = await product.findByIdAndUpdate({_id:productId},{$inc:{quantity:-quantities,sales:quantities}})
            }
           
            const order = new Order({
                user:userId,
                products:productData.products,
                paymentMethod:paymentMethod,
                address:selectedAddress,
                date:Date.now(),

                totalAmount:subtotal
    
            })
            await order.save()
            await Cart.deleteOne({ user: userId });

            res.status(200).json({ success: true, message: 'Signature verified and order created successfully' });
        } else {
            console.log("Signature verification failed");
            res.status(400).json({ success: false, message: 'Signature verification failed' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



const cancelOrder= async(req,res)=>{
    try {
        let dataIndex=0
        const productId = req.body.productId;
        const userId = req.session.user_id
        console.log(productId+'1111111111111111111111');
        const productCart = await product.findOne({_id:productId})
        const orderData = await Order.find({user:userId})
        for(i=0;i<orderData.length;i++){
        if(orderData[i].products.find(product => product.product.toString() === productId)){
            var orderProduct = orderData[i].products.find(product => product.product.toString() === productId)
            dataIndex=i;
        };

        }
        if (orderProduct) {
            orderProduct.status = 'cancelled';

            await orderData[dataIndex].save();
            const productData = await product.findById(orderProduct.product);
            console.log(orderProduct.quantity+'22222222222222222');
            console.log(productData.quantity+'33333333333333');

            productData.quantity += orderProduct.quantity;
            productData.sales -= orderProduct.quantity;

            await productData.save();
           console.log(orderData[dataIndex].paymentMethod,'payyyyyyyyyyyyyyyyyyyyy');
            
            if (orderData[dataIndex].paymentMethod === 'Razorpay'|| orderData[dataIndex].paymentMethod === 'Wallet') {
                const user = await users.findById(userId);
                user.wallet += productCart.price * orderProduct.quantity;
                await user.save();
                const refundAmount = productCart.price * orderProduct.quantity

                 const walletTransaction = new Wallet({
                    user: userId,
                    amount: refundAmount,
                    type: 'credit',
            });
            await walletTransaction.save();
        
            }
            res.status(200).json({ message: 'succes' });
            
        }else{
            res.status(404).json({ message: 'Product not found in orders' });
         }

        
    } catch (error) {
        console.log(error);
    }
}

const returnOrder= async(req,res)=>{
    try {
        let dataIndex=0
        const productId = req.body.productId;
        const returnReason = req.body.reason;
        console.log(returnReason);
        const userId = req.session.user_id
        console.log(productId+'1111111111111111111111');
        const productCart = await product.findOne({_id:productId})
        const orderData = await Order.find({user:userId})
        for(i=0;i<orderData.length;i++){
        if(orderData[i].products.find(product => product.product.toString() === productId)){
            var orderProduct = orderData[i].products.find(product => product.product.toString() === productId)
            dataIndex=i;
        };

        }
        if (orderProduct) {
            orderProduct.status = 'Return request sended';
            orderProduct.returnReason=returnReason;

            await orderData[dataIndex].save();
           
            res.status(200).json({ message: 'succes' });
            
        }else{
            res.status(404).json({ message: 'Product not found in orders' });
         }

        
    } catch (error) {
        console.log(error);
    }
}

const orderDetails =async(req,res)=>{
    try {
        const userId = req.session.user_id;
        const productId = req.query.productId;
        const orderId = req.query.orderId;
        const orderData = await Order.findOne({_id:orderId}).populate('address.addresses')   
        const orders = await Order.find({user:userId}).populate('products.product')
        const address = await Address.findOne({user:userId})
        let orderProduct = null;
        orders.forEach(order => {
            order.products.forEach(product => {
                if (product.product._id.toString() === productId) {
                    orderProduct = product;
                }
            });
        });
        let orderAddress = null;
        address.addresses.forEach(add=>{
            if(add._id.toString()===orderData.address.toString()){
                orderAddress=add
            }
        })
        const formattedDate = orderData.date.toLocaleString('en-US', { timeZone: 'UTC' });
        
        res.render('orderDetails',{orderProduct,orders,orderData,formattedDate,orderAddress})
        
    } catch (error) {
        console.log(error);
    }
}






module.exports={
    order,
    cancelOrder,
    orderDetails,
    RazorpayOrder,
    verifySignature,
    walletOrder,
    returnOrder
}