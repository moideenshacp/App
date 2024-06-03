const users = require('../models/userModel');
const categories =  require('../models/category')
const Cart = require('../models/cart');
const product = require('../models/product');
const Address = require('../models/address');
const Order = require('../models/order')
const { logout } = require('./adminController');




const order = async(req,res)=>{
    try {
        const userId = req.session.user_id;
        const { selectedAddress,paymentMethod,subtotal} = req.body;

        const productData = await Cart.findOne({user:userId}).populate('products.product')
       
        const order = new Order({
            user:userId,
            products:productData.products,
            paymentMethod:paymentMethod,
            address:selectedAddress,
            date:Date.now(),
            totalAmount:subtotal

        })
        await order.save()
        await Cart.deleteOne({ user: userId });
        res.status(200).json({message:'succes'})
const length = productData.products.length;

for(i=0;i<length;i++){
    const productId = productData.products[i].product._id
    const quantities = productData.products[i].quantity;
    
        const productcheck = await product.findByIdAndUpdate({_id:productId},{$inc:{quantity:-quantities}})
    

}

    } catch (error) {
        console.log(error);
    }
}


module.exports={
    order,
}