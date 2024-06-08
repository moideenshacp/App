
const users = require('../models/userModel');
const categories =  require('../models/category')
const Cart = require('../models/cart');
const product = require('../models/product');
const Address = require('../models/address');
const Order = require('../models/order');
const Razorpay = require('razorpay');
const { logout } = require('./adminController');
require('dotenv').config();




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

//razorpay





module.exports={
    order,
    cancelOrder,
    orderDetails
}