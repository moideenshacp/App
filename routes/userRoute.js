const express = require('express')
const user_route = express();
const bodyparser = require('body-parser');
const session = require('express-session');
const config = require('../config/config')
user_route.use(session({secret:config.sessionsecret}));

// const auth = require('../middleware/auth')

//for view engine
user_route.set('view engine','ejs');
user_route.set('views','./views/users');

const userController = require('../controllers/userController');

user_route.use(bodyparser.json());
user_route.use(bodyparser.urlencoded({extended:true}));


user_route.get('/',userController.loadHome)
user_route.get('/signup',userController.SignupHome)
user_route.post('/signup',userController.insertUser)
user_route.get('/login',userController.loadLogin)
user_route.post('/login',userController.insertUser)
user_route.post('/',userController.verify)


//for otp

user_route.get('/otp',userController.loadOtp)
user_route.post('/otp',userController.verificationOtp)







module.exports = user_route;
