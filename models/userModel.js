const mongoose = require("mongoose");

const userSchema = mongoose.Schema({

    name:{
        type:String,
        // required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        // required:true
    },
    mobile:{
        type:String,
        // required:true
    },
    is_admin:{
        type:Number,

    },
    is_blocked:{
        type:Boolean,
        default:false
    },
    wallet: {
        type: Number,
        default: 0
    }
    

})

module.exports = mongoose.model('users',userSchema);