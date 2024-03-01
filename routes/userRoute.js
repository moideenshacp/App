const express = require('express')
const user_route = express();
const bodyparser = require('body-parser');
// const session = require('express-session');
// const config = require('../config/config')
// user_route.use(session({secret:config.sessionsecret}));

// const auth = require('../middleware/auth')


user_route.set('view engine','ejs');
user_route.set('views','./views/users');

const userController = require('../controllers/userController');

user_route.use(bodyparser.json());
user_route.use(bodyparser.urlencoded({extended:true}));


user_route.get('/',userController.loadHome)
user_route.get('/login',userController.loadLogin)







module.exports = user_route;
