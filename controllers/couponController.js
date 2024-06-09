
const { trusted } = require('mongoose');
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

//add coupon


const couponAdd = async(req,res)=>{
    try {

        const coupons = await Coupon.find({})


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
         return res.redirect('/admin/coupon');

        
    } catch (error) {
        console.log(error);
    }
}

//edit coupon load
const editCouponLoad = async(req,res)=>{
    try {
        const id = req.query.id;
        const couponFind = await Coupon.findOne({_id:id})
        const formattedExpireDate = couponFind.expireDate.toISOString().split('T')[0];
        return res.render('couponEdit',{couponFind,formattedExpireDate})
        
    } catch (error) {
        console.log(error);
    }
}

const updateCoupon = async(req,res)=>{
    try {
        const id = req.body.id
        const couponFind = await Coupon.findOne({_id:id})
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

        const updateCoupon = await Coupon.findByIdAndUpdate(id,{$set:{name:name,code:code,discount:discount,minAmount:minamount,expireDate:expireDate,description:description}})
        return res.redirect('/admin/coupon');

    } catch (error) {
        console.log(error);
    }
}

//coupon list and unlist
const couponShow = async(req,res)=>{
    try {
        const id = req.query.id;
        const coupon = await Coupon.findById(id)
        if(coupon.status===true){
            await Coupon.updateOne({_id:id},{status:false})
        }else{
            await Coupon.updateOne({_id:id},{status:true})

        }

        return res.redirect('/admin/coupon')
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    couponAddLoad,
    couponList,
    couponAdd,
    editCouponLoad,
    updateCoupon,
    couponShow
}