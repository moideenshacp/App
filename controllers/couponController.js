
const { trusted } = require('mongoose');
const Coupon = require('../models/coupon');
const Cart = require('../models/cart');






const couponAddLoad = async(req,res)=>{
    try {
        res.render('couponAdd')
        
    } catch (error) {
        console.log(error);
    }
}


const couponList = async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 3;
        const skip = (page - 1) * limit;
        const coupons = await Coupon.find({}).skip(skip).limit(limit)

        const totalCoupons = await Coupon.countDocuments();
        const totalPages = Math.ceil(totalCoupons / limit);

        res.render('couponList',{coupons,currentPage: page,totalPages,limit})
        
    } catch (error) {
        console.log(error);
    }
}

//add coupon


const couponAdd = async(req,res)=>{
    try {

        const coupons = await Coupon.find({})
        const today = new Date();


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
        const existingCouponName = await Coupon.findOne({ name});
        if (existingCouponName) {
            return res.render('couponAdd', { messages: 'Coupon with the same name already exist', name, code, minamount, discount, expireDate, description });
        }
        const existingCouponCode = await Coupon.findOne({ code});
        if (existingCouponCode) {
            return res.render('couponAdd', { messages: 'Coupon with the same code already exist', name, code, minamount, discount, expireDate, description });
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


//apply coupon
const applyCoupon = async(req,res)=>{
    try {
    const userId = req.session.user_id;
    const {couponCode,subtotal}= req.body;
    const cartFind = await Cart.findOne({user:userId});

        req.session.coupon= req.body.couponCode

    const couponCheck = await Coupon.findOne({code:couponCode})
    if (!couponCheck) {
        console.log('789654');
        return res.status(200).json({ message: 'Coupon not found' });
    }

    if (couponCheck.expireDate < new Date()) {
        console.log('exp');
        return res.status(200).json({ message: 'Coupon has expired' });
    }
    if (!Array.isArray(couponCheck.usedUsers)) {
        couponCheck.usedUsers = [];
    }

    const userHasUsedCoupon = couponCheck.usedUsers.some(user => user._id.toString() === userId.toString());

    if (userHasUsedCoupon) {
        return res.status(200).json({ message: 'Coupon is already used' });
      }
    if (couponCheck.status==false) {
        console.log('status');
        return res.status(200).json({ message: 'Coupon is not active' });
    }
    if(couponCheck.minAmount>subtotal){
        return res.status(200).json({ message: 'min amount is not valid' });

    }

    let discountAmount = (subtotal * couponCheck.discount) / 100;
    discountAmount = Math.floor(discountAmount);
    let discountedSubtotal = subtotal - discountAmount;
    console.log(discountedSubtotal);


    couponCheck.usedUsers.push(userId);
        await couponCheck.save();
        console.log('done');
        res.status(200).json({ message: 'Coupon applied successfully', discountedSubtotal })

} catch (error) {
        console.log(error);
    }
}

const removeCoupon = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { subtotal } = req.body;

        const cartFind = await Cart.findOne({ user: userId });
        if (!cartFind) {
            return res.status(200).json({ message: 'Cart not found' });
        }

        const couponCode = req.session.coupon;
        if (!couponCode) {
            return res.status(200).json({ message: 'No coupon applied' });
        }

        const couponCheck = await Coupon.findOne({ code: couponCode });
        if (!couponCheck) {
            return res.status(200).json({ message: 'Coupon not found' });
        }

        const userIndex = couponCheck.usedUsers.findIndex(user => user._id.toString() === userId.toString());
        if (userIndex !== -1) {
            couponCheck.usedUsers.splice(userIndex, 1);
            await couponCheck.save();
        }
        req.session.coupon = null;
        res.status(200).json({ message: 'Coupon removed successfully', originalSubtotal: subtotal });
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    applyCoupon,
    removeCoupon,
    // other controllers
};




module.exports={
    couponAddLoad,
    couponList,
    couponAdd,
    editCouponLoad,
    updateCoupon,
    couponShow,
    //apply coupon===================
    applyCoupon,
    removeCoupon
}