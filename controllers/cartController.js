const users = require('../models/userModel');
const categories =  require('../models/category')
const Cart = require('../models/cart');
const product = require('../models/product');
const Address = require('../models/address')





const addCart = async(req,res)=>{
    try {

        const { productId, qty } = req.body;
        const userId = req.session.user_id;
        const quantity = qty && qty >= 1 ? qty : 1;
        const products = await product.findById(productId);
        const productPrice = products.price
        
        const userCart = await Cart.findOne({ user: userId })
        

            const existingCartproduct = await Cart.findOne({user:req.session.user_id,'products.product':productId})
        if(existingCartproduct){
            res.status(200).json({fail:'product is already in cart'})
        }else{
        

        if (!userCart) {
            const cart = new Cart({
                user: userId,
                products: [{ product: productId, quantity: quantity}]
            });
            await cart.save();
        } else {
            userCart.products.push({ product: productId, quantity: quantity});
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
        const cartData = await Cart.find({user:req.session.user_id})
        const cartcount = cartData.map(cartDoc => cartDoc.products.length);
            const cartPoducts = await Cart.find({user:req.session.user_id}).populate('products.product')
            let subtotal = 0;
            if(cartPoducts.length>0){
         subtotal = cartPoducts[0].products.reduce((acc, val) => {
            return acc += val.product.price * val.quantity;
        }, 0);
    }
            res.render('carts',{cartPoducts,subtotal,cartcount})
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
        res.status(200).json({message:'succes', quantity, price: productPrice.price,subtotal,quantity});
}
       
    } catch (error) {
        console.log((error));
    }
}

//load checkout
const loadCheckout = async(req,res)=>{
    try {

        const addressData = await Address.find({user:req.session.user_id})
        const address = await Address.findOne({user:req.session.user_id})

        const addressescount = addressData.map(addressDoc => addressDoc.addresses.length);


        const cartPoducts = await Cart.find({user:req.session.user_id}).populate('products.product')
        let subtotal = 0;
        if(cartPoducts.length>0){
         subtotal = cartPoducts[0].products.reduce((acc, val) => {
            return acc += val.product.price * val.quantity;
        }, 0);
    }
        res.render('checkout',{addressescount,address,cartPoducts,subtotal})
        
    } catch (error) {
        console.log(error);
    }
}
//load checkout address
const checkoutAddressLoad = async(req,res)=>{
    try {
        res.render('addAdress')
   
        
    } catch (error) {
        console.log(error);
    }
}

const checkoutAddress = async(req,res)=>{
    try {
        const userId = req.session.user_id;
        const userAddress = await Address.findOne({user:userId})
        if(!userAddress){
            const name =req.body.name.trim()
            const address = req.body.address.trim();
            const city = req.body.city.trim();
            const state = req.body.state.trim();
            const pincode  =  req.body.pincode.trim();
            const phone = req.body.phone.trim();
            const email = req.body.email.trim();
            if (!name || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(name)) {
                return res.render('addAdress', { messages: 'Invalid name provided',name,address,city,state,pincode,phone,email });
            }
            if (!address) {
                return res.render('addAdress', { messages: 'Invalid address provided',name,address,city,state,pincode,phone,email });
            }
            if (!city || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(city)) {
                return res.render('addAdress', { messages: 'Invalid city provided',name,address,city,state,pincode,phone,email });
            }
            if (!state || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(state)) {
                return res.render('addAdress', { messages: 'Invalid state provided',name,address,city,state,pincode,phone,email });
            }
            const mobileRegex = /^\d{10}$/;
            if(!mobileRegex.test(phone)){
               return res.render('addAdress',{messages:'invalid mobilenumber',name,address,city,state,pincode,phone,email})
            }
            const pincodeRegex = /^\d{6}$/;
            if(!pincodeRegex.test(pincode)){
                return res.render('addAdress',{messages:'invalid pincode,pincode must be 6 digits',name,address,city,state,pincode,phone,email})
             }
            const emailRegex = /^[A-Za-z0-9.%+-]+@gmail\.com$/;
            if(!emailRegex.test(email)){
                return res.render('addAdress',{messages:'invalid email provided',name,address,city,state,pincode,phone,email})
             }

            const addressAdd = new Address({
                user : userId,
                addresses:[{name:name,address:address,city:city,state:state,pincode:pincode,phone:phone,email:email}]

            });
            await addressAdd.save()

        }else{
            const name =req.body.name.trim()
            const address = req.body.address.trim();
            const city = req.body.city.trim();
            const state = req.body.state.trim();
            const pincode  =  req.body.pincode.trim();
            const phone = req.body.phone.trim();
            const email = req.body.email.trim();
            if (!name || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(name)) {
                return res.render('addAdress', { messages: 'Invalid name provided',name,address,city,state,pincode,phone,email });
            }
            if (!address) {
                return res.render('addAdress', { messages: 'Invalid address provided',name,address,city,state,pincode,phone,email });
            }
            if (!city || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(city)) {
                return res.render('addAdress', { messages: 'Invalid city provided',name,address,city,state,pincode,phone,email });
            }
            if (!state || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(state)) {
                return res.render('addAdress', { messages: 'Invalid state provided',name,address,city,state,pincode,phone,email });
            }
            const mobileRegex = /^\d{10}$/;
            if(!mobileRegex.test(phone)){
               return res.render('addAdress',{messages:'invalid mobilenumber',name,address,city,state,pincode,phone,email})
            }
            const pincodeRegex = /^\d{6}$/;
            if(!pincodeRegex.test(pincode)){
                return res.render('addAdress',{messages:'invalid pincode,pincode must be 6 digits',name,address,city,state,pincode,phone,email})
             }
            const emailRegex = /^[A-Za-z0-9.%+-]+@gmail\.com$/;
            if(!emailRegex.test(email)){
                return res.render('addAdress',{messages:'invalid email provided',name,address,city,state,pincode,phone,email})
             }

            userAddress.addresses.push({name:name,address:address,city:city,state:state,pincode:pincode,phone:phone,email:email})
            await userAddress.save()
        }
        

        res.redirect('/checkout')
        
        
    } catch (error) {
        console.log(error);
    }
}
const checkoutEditAddressLoad = async(req,res)=>{
    try {
        const addressId = req.query.id;
        const addressData = await Address.findOne({user:req.session.user_id})
        const index = addressData.addresses.find((value)=>value._id.toString()===addressId)
        if(index){
        res.render('checkoutEditAddress',{index})
        }
        
    } catch (error) {
        console.log(error);
    }
}

const checkoutEditAddress = async(req,res)=>{
    try {

        const {name,address,city,pincode,state,phone,email,addressId} = req.body;
        

        const addressData = await Address.findOne({user:req.session.user_id})
        const got = await Address.findOne({"addresses._id": addressId })        
        const updateAddress = await Address.findOneAndUpdate(  {
            "addresses._id": addressId 
        },{ 
            $set:{
                "addresses.$.name": name,
                "addresses.$.address": address,
                "addresses.$.city": city,
                "addresses.$.pincode": pincode,
                "addresses.$.state": state,
                "addresses.$.phone": phone,
                "addresses.$.email": email

            }
        })
            res.status(200).json({ message: 'succes' });
        
    } catch (error) {
        console.log(error);
    }
}


module.exports={
    loadCart,
    addCart,
    removeProduct,
    totalPrice,
    //checkout*****************************
    loadCheckout,
    checkoutAddress,
    checkoutAddressLoad,
    checkoutEditAddressLoad,
    checkoutEditAddress
}


