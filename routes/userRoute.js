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
const passport = require('passport');


user_route.use(passport.initialize())
user_route.use(passport.session())


//bodyparser
user_route.use(bodyparser.json());
user_route.use(bodyparser.urlencoded({extended:true}));

//loadhome
user_route.get('/',auth.isLogout,userController.loadHome)

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

//google
// user_route.get('/home',(req,res)=>{
//     res.render('userhome')
// })

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
user_route.get('/profile',auth.isLogin,userController.loadprofile)

//userhome
user_route.get('/home', blockAuth.block,auth.isLogin, userController.userhome)

//signout
user_route.get('/signout',auth.isLogin,userController.signout)

//product
user_route.get('/product',auth.isLogin,userController.loadproduct)
user_route.get('/productDetail',auth.isLogin,userController.productDetail)

//shop
user_route.get('/shop',auth.isLogin,userController.shop)




module.exports = user_route;
