const mongoose = require('mongoose')
const address = require('./address')

const orderSchema = mongoose.Schema({
    
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        // required: true
    },
    orderId:{
        type:Number

    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            // required: true
        },
        quantity: {
            type: Number,
            // required: true
        },
        
    status: {
        type: String,
        enum: ['pending', 'delivered','cancelled','Return request sended','Returned','Return Denied','payment failed'],
        default: 'pending'
    },
        total:{
            type:Number,
            // required:true
        },
        returnReason:{
           type:String
        }
        
    }],
    paymentMethod: {
        type: String,
        enum: ['cashOnDelivery','Razorpay','Wallet','Razorpay payment failed'],
        // required: true
    },
    totalAmount:{
        type:Number,
    },
    date:{
        type:Date,
        default:Date.now()
    },
    address:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'address'   
     },
    razorpayOrderId:{
        type:String
     },
     razorpayPaymentId:{
        type:String
     },
     razorpaySignature:{
        type:String
     },
     paymentStatus:{
        type:String,
        enum:['payment failed','payment success'],
     }


})
module.exports = mongoose.model('order',orderSchema)