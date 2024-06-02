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

        const product = await Cart.findOne({user:userId}).populate('products.product')
       console.log(product.products+'000000');
       
        const order = new Order({
            user:userId,
            products:product.products,
            paymentMethod:paymentMethod,
            address:selectedAddress,
            date:Date.now(),
            totalAmount:subtotal

        })
        await order.save()
        await Cart.deleteOne({ user: userId });
        res.status(200).json({message:'succes'})

    } catch (error) {
        console.log(error);
    }
}

//load orderDetails
const loadOrderDetails = async(req,res)=>{
    try {
        const id = req.query.id;
        console.log(id+'111111111111');
        const orderProducts = await Order.find({user:req.session.user_id}).populate('products.product')
        
        let orderProductDetail = null;

        // Iterate through each order
        orderProducts.forEach(order => {
           
            order.products.forEach(product => {
                console.log(product.product._id.toString() === id.toString());
console.log("product.product._id:", product.product._id.toString());
                if (product.product._id == id) {
                    orderProductDetail = {
                        order: order,
                        product: product
                    };
                }
            });
        });

        console.log("Order Product Detail:", orderProductDetail); // Log order product detail
    
        

        res.render('orderDetails')
    } catch (error) {
        console.log(error);
    }
}





module.exports={
    order,
    loadOrderDetails
}