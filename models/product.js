const mongoose = require('mongoose')
const category = require('./category')


const productSchema = mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    image:{
        type:Array,
        required:true
    },
    size:{
        type:Number,
        // required:true
    },
    description:{
        type:String,
        required:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'category'
    },
    is_listed:{
        type:Boolean,
        default:true
    }


})
module.exports = mongoose.model('product',productSchema)

