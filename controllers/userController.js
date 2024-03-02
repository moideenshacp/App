// const { name } = require('ejs');
const users = require('../models/userModel');
const otp = require('../models/otpModel')
const bcrypt = require('bcrypt');


//nodemailer
const nodemailer = require('nodemailer');
const { ReturnDocument } = require('mongodb');
let transporter = nodemailer.createTransport({
    host:'smtp-mail.outlook.com',
    auth:{
        user:'marsappproject@hotmail.com',
        pass:'marsapp10@'

    }
});

//test transporter
transporter.verify((error,success)=>{
    if(error){
        console.log(error);
    }else{
        console.log(success);
    }
})

//send email
const sendEmail = async(mailOptions)=>{
    try {
       await transporter.sendMail(mailOptions)
       return
    } catch (error) {
        console.log(error.message);
        
    }
}




//hashpassword
const securePassword = async(password)=>{
try {
    const passwordHash = await bcrypt.hash(password,10)
    return passwordHash;
    
} catch (error) {
    console.log(error.message);   
}

}


//for loading loginpage
const loadLogin = async(req,res)=>{
    try{
        res.render('login')
    }catch(error){
        console.log(error.messege);
    }
}

//for loading signuppage
const SignupHome = async(req,res)=>{
    try{
        res.render('signup')
    }catch(error){
        console.log(error.messege);
    }
}

//for loading Homepage
const loadHome = async(req,res)=>{
    try {
        res.render('home')
        
    } catch (error) {
        console.log(error.messege);
    }
}


//insert user

const insertUser = async(req,res)=>{
    try {
        
        const checkmail = await users.findOne({email:req.body.email})
        if (checkmail) {
            res.render('signup',{messages:'email already exist'})

        } else {
            const spassword  = await securePassword(req.body.password)
            const name = req.body.name.trim();
            if (!name || !/^[a-zA-Z][a-zA-Z\s]*$/.test(name)) {
                return res.render('signup', { messages: 'Invalid name provided' });
            }
            const email =req.body.email;
            const emailRegex = /^[A-Za-z0-9.%+-]+@gmail\.com$/;

            const mobile = req.body.mobile;
            const mobileRegex = /^\d{10}$/;
            if(!mobileRegex.test(mobile)){
               return res.render('signup',{messages:'invalid mobilenumber'})
            }
    
            // Check if the email is valid
            if (!emailRegex.test(email)) {
               return res.render('signup', { messages: 'Invalid email provided' });
            }

        
            const user = new users({
                name:req.body.name,
                email:req.body.email,
                password:spassword,
                mobile:req.body.mobile
    
            });
    
            const userdata  = await user.save();  
            if(userdata){
                res.render('signup',{messages:'Registered succesfully,Go to Login'})
            }else{
                res.render('signup',{messages:'failed to register'})
            }
           
            
        }
}
    catch(error){
        console.log(error.messege);
    }
 

}

//verify login

const verify = async(req,res)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await users.findOne({email:email});

        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);
            if(passwordMatch){
                    req.session.user_id = userData._id;
                    return res.render('home');
 
                    
                }else{
                   return  res.render('login',{message:'Please verify your mail.'});

                }

            }else{
               return res.render('login',{message:'Email and Password is incorrect'})
            }

        
    } catch (error) {
        console.log(error.message);
        
    }
}

//load otppage

const loadOtp = async(req,res)=>{
    try {
        res.render('otp')
        
    } catch (error) {
        console.log(error.message);
    }
}

//verification otp 

const verificationOtp = async(req,res)=>{
    try {

        const {email,subject,message,duration}= req.body;
        
    } catch (error) {
        console.log(error.message);
    }
}

//sendotp

const sendOtp = async({email,subject,message,duration = 1})=>{
    try {

        if(!(email && subject && message)){
            throw Error('provide values for email,subject and message')
        }
        
        //clear old otps
        await otp.deleteOne({email})

        //generated pin
        const generatedOtp = await generateOtp();

        //send email
        const mailOptions = {
            from : 'marsappproject@hotmail.com',
            to:email,
            subject,
            html : `<p>${message}</p> <p style='color:black;
            font-size:25px;letter-spacing:2px;'><b>${generatedOtp}
            </b></p><p>This code <b> expires in ${duration} hour(s)</b>.</p>`,
        }
        await sendEmail(mailOptions)

        //save otp in Db

        const otp = generatedOtp;
        const newOtp  = await new otp({
            email,
            otp:generatedOtp,
            createdAt :Date.now(),
            expiresAt :Date.now()+3600000 * +duration,
        })

        const createdOtpRecord = await newOtp.save();
        return createdOtpRecord;

    } catch (error) {
        console.log(error.message);
    }
}


//generate otp
const generateOtp = async()=>{
    try {

        return (otp = `${Math.floor(1000+Math.round()*9000)}`)
        
    } catch (error) {
        throw error
    }
}



module.exports= {
    loadHome,
    loadLogin,
    insertUser,
    verify,
    loadOtp,
    SignupHome,
    verificationOtp,
    sendOtp,
    generateOtp,
    sendEmail
  
}