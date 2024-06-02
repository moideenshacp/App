const express = require('express')
const user_route = express();
const bodyparser = require('body-parser');
const session = require('express-session');
const config = require('../config/config')
user_route.use(session({secret:config.sessionsecret}));

//middleware
const auth = require('../middleware/auth')
const blockAuth = require('../middleware/blockAuth')

//for view engine
user_route.set('view engine','ejs');
user_route.set('views','./views/users');

//controllers
const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const passport = require('passport');


user_route.use(passport.initialize())
user_route.use(passport.session())


//bodyparser
user_route.use(bodyparser.json());
user_route.use(bodyparser.urlencoded({extended:true}));

//loadhome
user_route.get('/',userController.loadHome)

//signup
user_route.get('/signup',auth.isLogout,userController.SignupHome)
user_route.post('/signup',userController.insertUser)

//login
user_route.get('/login',auth.isLogout,userController.loadLogin)
// user_route.post('/login',userController.insertUser)
user_route.post('/home',userController.verify)

//for otp
user_route.get('/otp',auth.isLogout,userController.loadOtp)
user_route.post('/otp',userController.verifyOtp)

//resend otp
user_route.post('/resendotp',userController.resendotp)


user_route.get('/google',passport.authenticate('google',{scope:['email','profile']}))

//google authentication
user_route.get('/auth/google/callback',auth.isLogout,passport.authenticate('google',{
    successRedirect:'/success',
    failureRedirect:'/failure'
}))
//for success
user_route.get('/success',auth.isLogout,userController.googleInsert)
//failure
user_route.get('/failure',auth.isLogout,userController.failureLogin)

user_route.get('/google',auth.isLogin,passport.authenticate('google',{failureRedirect:'/login'}),function(req,res){
    res.redirect('/home')

})


//profile
user_route.get('/profile',auth.isLogin,blockAuth.block,userController.loadprofile)

//userhome
user_route.get('/home', auth.isLogin,blockAuth.block, userController.userhome)

//signout
user_route.get('/signout',auth.isLogin,userController.signout)

//product
user_route.get('/product',auth.isLogin,blockAuth.block,userController.loadproduct)
user_route.get('/productDetail',auth.isLogin,blockAuth.block,userController.productDetail)

//shop
user_route.get('/shop',auth.isLogin,blockAuth.block,userController.shop)

//cart
user_route.get('/cart',cartController.loadCart)
user_route.post('/cart',cartController.addCart)
user_route.post('/removeProduct',cartController.removeProduct)
user_route.post('/totalPrice',cartController.totalPrice)

//create adress
user_route.get('/addAdress',userController.loadNewAdress)
user_route.post('/addAdress',userController.addAddress)
user_route.post('/removeAddress',userController.removeAddress)

//edit address
user_route.get('/edit-Address',userController.loadEditAddress)
user_route.post('/edit-Address',userController.updateAddress)

//load checkout
user_route.get('/checkout',cartController.loadCheckout)
//------------adddress add
user_route.get('/checkoutAddress',cartController.checkoutAddressLoad)
user_route.post('/checkoutAddress',cartController.checkoutAddress)
//-------------------edit adit
user_route.get('/checkoutEditAddress',cartController.checkoutEditAddressLoad)
user_route.post('/checkoutEditAddress',cartController.checkoutEditAddress)

//editprofile
user_route.post('/editProfile',userController.editProfile)

//forrgetpassword
user_route.get('/forgetPassword',userController.forgetpasswordLoad)
user_route.post('/forgetPassword',userController.forgetPassword)
user_route.post('/verifyOtpPassword',userController.verifyOtpPassword)
user_route.post('/resendotpPassword',userController.resendotpPassword)
user_route.post('/updatePassword',userController.updatePassword)

//cash on delivery

user_route.post('/order',orderController.order)
user_route.get('/orderDetails',orderController.loadOrderDetails)

module.exports = user_route;
