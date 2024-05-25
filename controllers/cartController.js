const users = require('../models/userModel');
const categories =  require('../models/category')
const products = require('../models/product')
const cart = require('../models/cart');


const addCart = async(req,res)=>{
    try {
        const id = req.query.id;
        const productData = await products.findById({_id:id})
        console.log((productData+"productttttttttttttttttttttttttttttttttttttttttttt"));
        const userId = req.session.user_id;
        if(productData){
            const cartData = new cart({
                user:userId,
                products:[{product:productData._id,quantity:1}]
            })
            const cartDb = await cartData.save()
            res.render('cart')
        }else{
            res.status(404).send('product not found')
        }
       
        
        
    } catch (error) {
        console.log(error);
    }
}


module.exports={
    addCart
}


