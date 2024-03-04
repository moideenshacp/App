const express = require('express')
const admin_route = express();
const session = require('express-session');
const config = require('../config/config');
const auth = require('../middleware/adminauth');
const bodyparser = require('body-parser');

admin_route.use(session({secret:config.sessionsecret}))




admin_route.use(bodyparser.json());
admin_route.use(bodyparser.urlencoded({extended:true}));

admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin');

//middleware

const adminController = require('../controllers/adminController')

//load login
admin_route.get('/',adminController.loadLogin)


module.exports = admin_route;