const users = require('../models/userModel');
const categories =  require('../models/category')
const Cart = require('../models/cart');
const product = require('../models/product');




const addCart = async(req,res)=>{
    try {

        const { productId, qty } = req.body;
        const userId = req.session.user_id;
        const quantity = qty && qty >= 1 ? qty : 1;
        const userCart = await Cart.findOne({ user: userId })

            const existingCartproduct = await Cart.findOne({user:req.session.user_id,'products.product':productId})
        if(existingCartproduct){
            res.status(200).json({fail:'product is already in cart'})
        }else{
        

        if (!userCart) {
            const cart = new Cart({
                user: userId,
                products: [{ product: productId, quantity: quantity }]
            });
            await cart.save();
        } else {
            userCart.products.push({ product: productId, quantity: quantity });
            await userCart.save();
        }

        res.status(200).json({message:'succes'})
    }
        
    } catch (error) {
        console.log(error);
    }
}
const loadCart = async(req,res)=>{
    try {
       
        console.log(req.session);
            const cartPoducts = await Cart.find({user:req.session.user_id}).populate('products.product')
            console.log(cartPoducts);
            let subtotal = 0;
            if(cartPoducts.length>0){
         subtotal = cartPoducts[0].products.reduce((acc, val) => {
            return acc += val.product.price * val.quantity;
        }, 0);
    }
            res.render('cart',{cartPoducts,subtotal})
        }
       
    catch (error) {
        console.log(error);
    }
}

const removeProduct = async(req,res)=>{
    try {
        
        const productId = req.body.productId;
        const deletedCart = await Cart.updateOne({'products.product':productId},{$pull:{products:{product:productId}}})



        res.status(200).json({message:'succes'})

        
    } catch (error) {
        console.log(error);
    }
}

const totalPrice = async(req,res)=>{
    try {
        
        const productId = req.body.productId;
        const quantity = req.body.qty;
        const productPrice = await product.findOne({_id:productId})
        const updateCart = await Cart.updateOne({'products.product':productId},{ $set: { 'products.$.quantity': quantity } })

if(updateCart){
    const fullProduct = await Cart.findOne({user:req.session.user_id}).populate('products.product');
    const subtotal = fullProduct.products.reduce((acc, val) => {
        return acc += val.product.price * val.quantity;
    }, 0);
        res.status(200).json({message:'succes', quantity, price: productPrice.price,subtotal});
}
       
    } catch (error) {
        console.log((error));
    }
}

module.exports={
    loadCart,
    addCart,
    removeProduct,
    totalPrice
}


