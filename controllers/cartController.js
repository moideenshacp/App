const users = require('../models/userModel');
const categories =  require('../models/category')
const products = require('../models/product')
const Cart = require('../models/cart');
const product = require('../models/product');




const addCart = async(req,res)=>{
    try {

        const { productId, qty } = req.body;
        console.log(productId+'userrhome');
        const userId = req.session.user_id;
        console.log(userId+'11111111111111');
        const quantity = qty && qty >= 1 ? qty : 1;
        const userCart = await Cart.findOne({ user: userId });

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
        console.log(addCart);
        
        // res.redirect('/productDetail')
        res.status(200).json({message:'succes'})
        
    } catch (error) {
        console.log(error);
    }
}
const loadCart = async(req,res)=>{
    try {
            const cartPoducts = await Cart.find({}).populate('products.product')
            console.log(cartPoducts);
            res.render('cart',{cartPoducts})
        }
       
    catch (error) {
        console.log(error);
    }
}

const removeProduct = async(req,res)=>{
    try {
        const id =req.body.cartId;
        await Cart.deleteOne({_id:id})
        console.log(id+'ddddddddddddddddddddddddddddddddddddddddddcartId');  
        res.status(200).json({message:'succes'})

        
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    loadCart,
    addCart,
    removeProduct
}


