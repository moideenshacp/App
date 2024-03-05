const express = require('express')
const user_route = express();
const bodyparser = require('body-parser');
const session = require('express-session');
const config = require('../config/config')
user_route.use(session({secret:config.sessionsecret}));

const auth = require('../middleware/auth')

//for view engine
user_route.set('view engine','ejs');
user_route.set('views','./views/users');

const userController = require('../controllers/userController');

user_route.use(bodyparser.json());
user_route.use(bodyparser.urlencoded({extended:true}));

//loadhome
user_route.get('/',auth.isLogout,userController.loadHome)

//signup
user_route.get('/signup',auth.isLogout,userController.SignupHome)
user_route.post('/signup',userController.insertUser)

//login
user_route.get('/login',auth.isLogout,userController.loadLogin)
user_route.post('/login',userController.insertUser)

user_route.post('/',userController.verify)
// user_route.('/',userController.verifyOtp)


//for otp

user_route.get('/otp',auth.isLogout,userController.loadOtp)
user_route.post('/otp',userController.verifyOtp)

//resend otp
user_route.post('/resendotp',userController.resendotp)

//profile
user_route.get('/profile',auth.isLogin,userController.loadprofile)
//userhome
user_route.get('/home',auth.isLogin,userController.userhome)

//signout
user_route.get('/signout',auth.isLogin,userController.signout)






module.exports = user_route;
