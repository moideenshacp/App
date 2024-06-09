
const users = require('../models/userModel');
const categories =  require('../models/category')
const Cart = require('../models/cart');
const product = require('../models/product');
const Address = require('../models/address');
const Order = require('../models/order');
const Razorpay = require('razorpay');
const { logout } = require('./adminController');
const crypto = require('crypto');
require('dotenv').config();
var {
    validatePaymentVerification,
  } = require("razorpay/dist/utils/razorpay-utils");




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
            
            const productcheck = await product.findByIdAndUpdate({_id:productId},{$inc:{quantity:-quantities}})
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
const RazorpayOrder = async (req,res)=>{
    try {
        const {subtotal} = req.body
        console.log("we get innn");
        const amount = subtotal * 100;
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
                
                const productcheck = await product.findByIdAndUpdate({_id:productId},{$inc:{quantity:-quantities}})
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

            await productData.save();
            
        }
        res.status(200).json({ message: 'succes' });
        

        
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
    verifySignature
}