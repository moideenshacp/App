const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/App");

const express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session')
const config = require('./config/config')
const bodyParser = require('body-parser')
var adminRouter = require('./routes/adminRoute');
var usersRouter = require('./routes/userRoute');

const app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({secret:config.sessionsecret}))
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



const port = process.env.PORT||3001;


//for user routes
const userRoute = require('./routes/userRoute')
app.use('/',userRoute)

//for admin routes
const adminRoute = require('./routes/adminRoute');
const { name } = require('ejs');;
app.use('/admin',adminRoute)



app.listen(port,()=>{console.log("Listening to the server on http://localhost:3001")});



module.exports = app;