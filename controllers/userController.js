// const { name } = require('ejs');
const users = require('../models/userModel');
const Otp = require('../models/otpModel')
const bcrypt = require('bcrypt');
const { use, emit } = require('../app');
const nodemailer = require('nodemailer');
// const { name } = require('ejs');



//to generate otp
function generateOtp(){
    var digits ='1234567890';
    var otp ='';
    for(let i=0;i<6;i++){
        otp+=digits[Math.floor(Math.random()*10)]
    }
    return otp;
}


//for send otp
const sendOtpMail = async(name,email,userda_id)=>{
    try {
        const otp = generateOtp();
        
      // Store OTP in the database
      const newOtp = new Otp({
        email: email,
        otp: otp,
        createdAt: new Date(), // Set the current date/time as the creation time
        expiredAt: new Date(new Date().getTime() + 1 * 60 * 1000) // Set the expiry time
    });
    await newOtp.save(); // Save the OTP document to the database

      const transporter =   nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:'moideenshacp28@gmail.com',
                pass:'fcnk qnbj fqpj pmuz'
            }
        });
       
        const mailOptions = {
            from :'moideenshacp28@gmail.com',
            to:email,
            subject:'OTP Verification',
            html:` <p>Hi ${name}, please verify this OTP: ${otp}</p>`
        }
        transporter.sendMail(mailOptions,function(error){
            if (error) {
                console.log(error.message);
            } else {
                console.log('otp send successfully');
                
            }
        })
        
        
    } catch (error) {
        console.log(error.message);
    }
}

Otp.collection.createIndex({ "expiredAt": 1 }, { expireAfterSeconds: 0 });

let userdata;

// Function to verify OTP
const verifyOtp = async (req, res) => {
    try {
        const { email, otp  } = req.body;
        console.log(otp);

        const otpData = await Otp.findOne({otp:otp});
        // const dataotp = otpData.otp
        // const otpfound = otpData.otp;
    //    const otps = req.body.OTP;
       console.log(otpData);
  
      
        // Check if otp exists
        // if (!otpData) {
        //     return res.render('otp', { messages: 'OTP not found' });
        // }

        // Check if otp has expired
        const currentTime = new Date();
        if (currentTime > otpData.expiredAt) {
            return res.render('otp', { messages: 'OTP has expired' });
        }

        // Compare otp
        if (otpData && otpData.otp === otp) {
          await userdata.save()
          if(userdata){
                  return res.render('login', { message: 'registered successfully,Login in now' });
          }
        } else {
            return res.render('otp', { messages: 'Invalid OTP' });
            
        }

    } catch (error) {
        console.log(error.message);
        return res.render('otp', { messages: 'An error occurred during OTP verification' });
    }
};







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
    
           userdata  = await user;  
            if(userdata){
                await sendOtpMail(req.body.name,req.body.email,userdata._id)
                res.render('otp',{messages:'Check your email for the OTP and enter it below'})
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
                    return res.render('userhome');
 
                    
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
//load profile
const loadprofile = async(req,res)=>{
    try {
        res.render('profile')
    } catch (error) {
        console.log(error.message);
    }
}

//load userhome
const userhome = async(req,res)=>{
    try {
        res.render('userhome')
    } catch (error) {
        console.log(error.message);
    }
}


//signout
const signout = async(req,res)=>{
    try {
        req.session.destroy()
        res.render('home')
        
    } catch (error) {
        console.log(error.message);
    }
}







module.exports= {
    loadHome,
    loadLogin,
    insertUser,
    verify,
    loadOtp,
    SignupHome,
    verifyOtp,
    loadprofile,
    userhome,
    signout
   
  
   
}