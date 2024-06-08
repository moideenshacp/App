const mongoose = require('mongoose')
const address = require('./address')

const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        // required: true
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
        enum: ['pending', 'delivered','cancelled'],
        default: 'pending'
    },
        total:{
            type:Number,
            // required:true
        }
        
    }],
    paymentMethod: {
        type: String,
        enum: ['cashOnDelivery','Razorpay'],
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
     }


})
module.exports = mongoose.model('order',orderSchema)