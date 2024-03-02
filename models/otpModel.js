const mongoose = require('mongoose')

const otpSchema = mongoose.Schema({
    email :{type:String,unique:true},
    otp:String,
    createdAt : Date,
    expiredAt : Date
})

module.exports = mongoose.model('otp',otpSchema)