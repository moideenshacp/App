const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/App");

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session')
const config = require('./config/config')
const bodyParser = require('body-parser')
const adminRouter = require('./routes/adminRoute');
const usersRouter = require('./routes/userRoute');
const nocache = require('nocache')
// 
require('dotenv').config()
const passport = require('passport')
require('./passportsetup')

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({secret:config.sessionsecret}))
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(nocache())


const port = process.env.PORT||3000;


//for user routes
const userRoute = require('./routes/userRoute')
app.use('/',userRoute)

//for admin routes
const adminRoute = require('./routes/adminRoute');
const { name } = require('ejs')
;
app.use('/admin',adminRoute)





app.listen(port,()=>{console.log("Listening to the server on http://localhost:3000")});



module.exports = app;