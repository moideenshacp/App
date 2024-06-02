const express = require('express')
const admin_route = express();
const session = require('express-session');
const config = require('../config/config');
const bodyparser = require('body-parser');
const path = require('path')
admin_route.use(session({secret:config.sessionsecret}))
const multer= require('multer')

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/productImages/productImages'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    }
  });


const upload = multer({storage:storage})


admin_route.use(bodyparser.json());
admin_route.use(bodyparser.urlencoded({extended:true}));

admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin');

//middleware
const auth = require('../middleware/adminAuth');

const adminController = require('../controllers/adminController')

//load login
admin_route.get('/',auth.isLogout,adminController.loadLogin)

//verify login
admin_route.post('/',adminController.verifyLogin)

//load home
admin_route.get('/home',auth.isLogin,adminController.loadHome)

//logout
admin_route.get('/logout',auth.isLogin,adminController.logout)

//customers page
admin_route.get('/customers',auth.isLogin,adminController.customers)
admin_route.get('/blockuser/:Id',auth.isLogin, adminController.block);

//addproduct
admin_route.get('/addproduct',auth.isLogin,adminController.addproduct)
admin_route.post('/addproduct',auth.isLogin,upload.array('image',4),adminController.productAdd)


//productlist
admin_route.get('/products',auth.isLogin,adminController.productList)
admin_route.get('/listproduct/:Id',auth.isLogin,adminController.listProduct)

//edit product
admin_route.get('/edit-product',auth.isLogin,adminController.editProductLoad)
admin_route.post('/edit-product',auth.isLogin,upload.array('image',4),adminController.editProduct)


//category
admin_route.get('/category',auth.isLogin,adminController.category)
admin_route.post('/category',auth.isLogin,adminController.addcategory)
admin_route.get('/listcategory/:Id',auth.isLogin, adminController.listCategory);

//edit category
admin_route.get('/edit-category',auth.isLogin,adminController.editCategoryLoad)
admin_route.post('/edit-category',adminController.editcategory)

//order
admin_route.get('/order',adminController.loadOrder)

module.exports = admin_route;