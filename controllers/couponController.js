
const Coupon = require('../models/coupon');





const couponAddLoad = async(req,res)=>{
    try {
        res.render('couponAdd')
        
    } catch (error) {
        console.log(error);
    }
}


const couponList = async(req,res)=>{
    try {
        res.render('couponList')
        
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    couponAddLoad,
    couponList
}