
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
        const coupons = await Coupon.find({})
        res.render('couponList',{coupons})
        
    } catch (error) {
        console.log(error);
    }
}

const couponAdd = async(req,res)=>{
    try {



        const {name,code,minamount,discount,expireDate,description} = req.body
        if (!name || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(name)) {
            return res.render('couponAdd', { messages: 'Invalid name provided',name,code,minamount,discount,expireDate,description});
        }        
        if (!code || !/^\d{3,}$/.test(code)) {
            return res.render('couponAdd', { messages: 'Invalid coupon code provided. It must be at least 3 digits.', name, code, minamount, discount, expireDate, description });
        }
        if (!discount || isNaN(discount) || discount < 1 || discount > 100) {
            return res.render('couponAdd', { messages: 'Invalid discount provided. It must be a percentage between 1 and 100.', name, code, minamount, discount, expireDate, description });
        }
        if (!minamount || isNaN(minamount) || minamount <= 0) {
            return res.render('couponAdd', { messages: 'Invalid minimum amount provided. It must be a positive number.', name, code, minamount, discount, expireDate, description });
        }
        if (!expireDate || isNaN(Date.parse(expireDate))) {
            return res.render('couponAdd', { messages: 'Invalid expiry date provided.', name, code, minamount, discount, expireDate, description });
        }
        if (!description || /^\s*$/.test(description)) {
            return res.render('couponAdd', { messages: 'Invalid discription provided.', name, code, minamount, discount, expireDate, description });
        }
        const existingCoupon = await Coupon.findOne({ name, code });
        if (existingCoupon) {
            return res.render('couponAdd', { messages: 'Coupon with the same name and code already exists.', name, code, minamount, discount, expireDate, description });
        }

        const newCoupon= new Coupon({
            name:name,
            code:code,
            discount:discount,
            minAmount:minamount,
            expireDate:expireDate,
            description:description,

        })
        await newCoupon.save()
        res.render('couponList', { successMessage: 'Coupon added successfully!' });

        
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    couponAddLoad,
    couponList,
    couponAdd
}