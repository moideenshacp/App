const users = require('../models/userModel');
const categories =  require('../models/category')
const Cart = require('../models/cart');
const product = require('../models/product');
const Address = require('../models/address'); 
const Wishlist = require('../models/wishlist')
const { logout } = require('./adminController');
const wishlist = require('../models/wishlist');
 
 
 
 
 
 
 const wishlistLoad = async(req,res)=>{
    try {
        const wishlistData = await Wishlist.find({user:req.session.user_id}).populate('products.product')
        const wishlistCount = wishlistData.map(wishlistDoc=>wishlistDoc.products.length)
        res.render('wishlist',{wishlistData,wishlistCount})
        
    } catch (error) {
        console.log(error);
    }
 }

 const addWishlist =async(req,res)=>{
    try {
        const productId=req.body.productId;
        const userId = req.session.user_id;

        const checkWishlist = await Wishlist.findOne({user:userId})
        const existingWishlistproduct = await Wishlist.findOne({user:userId,'products.product':productId})
        if(existingWishlistproduct){
            res.status(200).json({fail:'product is already in wishlist'})
        }else{

        if(!checkWishlist){
            const wishlistData = new Wishlist({
                user:userId,
                products:[{product:productId}]
            })
            await wishlistData.save()
        }else{
            checkWishlist.products.push({product:productId})
            await checkWishlist.save()
        }
        res.status(200).json({message:'succes'})
    }
        
    } catch (error) {
        console.log(error);
    }
 }

 const removeProductWishlist = async(req,res)=>{
    try {
        
        const productId = req.body.productId;
        const deletedCart = await Wishlist.updateOne({'products.product':productId},{$pull:{products:{product:productId}}})



        res.status(200).json({message:'succes'})

        
    } catch (error) {
        console.log(error);
    }
}

 module.exports={
    wishlistLoad,
    addWishlist,
    removeProductWishlist
 }