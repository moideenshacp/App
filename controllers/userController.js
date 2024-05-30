// const { name } = require('ejs');
const users = require('../models/userModel');
const Otp = require('../models/otpModel')
const categories =  require('../models/category')
const products = require('../models/product')
const cart = require('../models/cart')
const Address = require('../models/address')
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
// const { name } = require('ejs');
const passport = require('passport');
const category = require('../models/category');



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
const sendOtpMail = async(name,email)=>{
    try {
        const otp = generateOtp();
        
      // Store OTP in the database
      const newOtp = new Otp({
        email: email,
        otp: otp,
        createdAt: new Date(), // Set the current date
        expiredAt: new Date(new Date().getTime() + 1 * 60 * 1000) // Set the expiry time
    });
    await newOtp.save(); 
    

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





//resend
const resendotp  = async(req,res,email)=>{
    
   try {
       // Check if the user exists in the database
   const existingOTP = await Otp.findOne({ email:req.session.email });
   console.log(existingOTP);
   

   if (existingOTP) {
    await Otp.deleteOne({email:req.session.email})
       // Generate a new OTP
       await sendOtpMail(req.session.name,req.session.email,userdata._id)
       
 
   }
   res.render('otp')
    

   } catch (error) {
    console.log(error.message);
   }

}

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
        if (!otpData) {
            return res.render('otp', { messages: ' Invalid OTP' });
        }

        // Check if otp has expired
        const currentTime = new Date();
        if (currentTime > otpData.expiredAt) {
            return res.render('otp', { messages: 'OTP has expired' });
        }
        

        // Compare otp
        if (otpData && otpData.otp === otp) {
            const user = new users({
                name: req.session.name,
                email: req.session.email,
                password: req.session.password,
                mobile: req.session.mobile,
                is_admin: 0,
            });
            const userDatas = await user.save();

            
            req.session.user_id = null;
            req.session.email = null;
            req.session.name = null;
            req.session.mobile = null;
            req.session.password=null;
          
          if(userDatas){
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
            if (!name || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(name)) {
                return res.render('signup', { messages: 'Invalid name provided' });
            }
            const email =req.body.email;
            const emailRegex = /^[A-Za-z0-9.%+-]+@gmail\.com$/;
            const hasLowerCase = /[a-z]/;
            const hasUpperCase = /[A-Z]/;
            const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
            if (!req.body.password || !hasLowerCase.test(req.body.password) || !hasUpperCase.test(req.body.password) || !hasSpecialChar.test(req.body.password)) {
                return res.render('signup', { messages: 'Password must contain at least one lowercase letter, one uppercase letter, and one special character' });
            }


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
                mobile:req.body.mobile,
                is_admin:0,
                
    
            });
    
            userdata  = await user; 
            req.session.user_id =userdata._id;
            req.session.email = userdata.email;
            req.session.name = userdata.name;
            req.session.mobile = req.body.mobile;
            req.session.password=userdata.password
            
            if(userdata){
                await sendOtpMail(req.body.name,req.body.email)
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
//google user

const googleInsert = async(req,res)=>{
    try {



        const email = req.user.emails[0].value;
        const name = req.user.displayName;
        // const googleID = req.user.id;
        console.log("_________________________________________________________"+email);

        const checkEmail = await users.findOne({email:email})
        if(checkEmail){
            req.session.user_id = checkEmail._id;
            res.redirect('/home')
        }else{
            const googleuser = new users({
                name:name,
                email:email,
                // googleID:googleID
    
            });
        
          const usergoogle =   await googleuser.save()
          if(usergoogle){
            req.session.user_id = usergoogle._id;
            res.redirect('/home')
        }

          

        }
    } catch (error) {
        console.log(error.message);
        
    }
}

//failure login
const failureLogin = async(req,res)=>{
    try {
        res.render('login')
        
    } catch (error) {
        console.log(error.message);
    }
}

//verify login

const verify = async(req,res)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await users.findOne({email:email});

        if(userData){
            if(userData.is_blocked===false){
            const passwordMatch = await bcrypt.compare(password,userData.password);
            if(passwordMatch){
                    req.session.user_id =userData._id;
                    
                    res.redirect('/home');
                
                    
                }else{
                    res.render('login',{messages:'incorrect email or password'});

                }
            }else{
                res.render('login',{messages:'Access Restricted'})
            }

            }else{
               res.render('login',{messages:'Email and Password is incorrect'})
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


//load userhome
const userhome = async(req,res)=>{

    try {
        
        const productData = await products.find({}).populate('category')
        res.render('userhome',{productData})
    } catch (error) {
        console.log(error.message);
    }
}

//load profile
const loadprofile = async(req,res)=>{
    try {
        const user = await users.find({_id:req.session.user_id})
        const address = await Address.findOne({user:req.session.user_id})
        res.render('profile',{address,user})
    } catch (error) {
        console.log(error.message);
    }
}




////load product
const loadproduct = async(req,res)=>{
    try {
        res.render('product')
    } catch (error) {
        console.log(error.message);
    }
}

//load product
const productDetail = async(req,res)=>{
    try {
        const id = req.query.id;
        const productData = await products.findById({_id:id}).populate('category')
        const productDatas = await products.find({})
        const relatedProducts = await products.find({category:productData.category}).populate('category')
        res.render('productDetail',{productData,productDatas,relatedProducts})
        
    } catch (error) {
        console.log(error.message);
    }
}

//load shop

const shop = async(req,res)=>{
    try {
        const productData = await products.find({}).populate('category')
        
        res.render('shop',{productData})
    } catch (error) {
        console.log(error);
    }
}

//load cart

const cartLoad = async(req,res)=>{
    try {
        res.render('cart')
    } catch (error) {
        console.log(error);
    }
}

//load newAdress
const loadNewAdress = async(req,res)=>{
    try {
        res.render('addAdress')
        
    } catch (error) {
        console.log(error);
    }
}

//add address
const addAddress =  async(req,res)=>{
    try {

        const userId = req.session.user_id;
        const userAddress = await Address.findOne({user:userId})
        if(!userAddress){
            const name =req.body.name.trim()
            const address = req.body.address.trim();
            const city = req.body.city.trim();
            const state = req.body.state.trim();
            const pincode  =  req.body.pincode.trim();
            const phone = req.body.phone.trim();
            const email = req.body.email.trim();
            if (!name || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(name)) {
                return res.render('addAdress', { messages: 'Invalid name provided',name,address,city,state,pincode,phone,email });
            }
            if (!address) {
                return res.render('addAdress', { messages: 'Invalid address provided',name,address,city,state,pincode,phone,email });
            }
            if (!city || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(city)) {
                return res.render('addAdress', { messages: 'Invalid city provided',name,address,city,state,pincode,phone,email });
            }
            if (!state || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(state)) {
                return res.render('addAdress', { messages: 'Invalid state provided',name,address,city,state,pincode,phone,email });
            }
            const mobileRegex = /^\d{10}$/;
            if(!mobileRegex.test(phone)){
               return res.render('addAdress',{messages:'invalid mobilenumber',name,address,city,state,pincode,phone,email})
            }
            const pincodeRegex = /^\d{6}$/;
            if(!pincodeRegex.test(pincode)){
                return res.render('addAdress',{messages:'invalid pincode,pincode must be 6 digits',name,address,city,state,pincode,phone,email})
             }
            const emailRegex = /^[A-Za-z0-9.%+-]+@gmail\.com$/;
            if(!emailRegex.test(email)){
                return res.render('addAdress',{messages:'invalid email provided',name,address,city,state,pincode,phone,email})
             }

            const addressAdd = new Address({
                user : userId,
                addresses:[{name:name,address:address,city:city,state:state,pincode:pincode,phone:phone,email:email}]

            });
            await addressAdd.save()

        }else{
            const name =req.body.name.trim()
            const address = req.body.address.trim();
            const city = req.body.city.trim();
            const state = req.body.state.trim();
            const pincode  =  req.body.pincode.trim();
            const phone = req.body.phone.trim();
            const email = req.body.email.trim();
            if (!name || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(name)) {
                return res.render('addAdress', { messages: 'Invalid name provided',name,address,city,state,pincode,phone,email });
            }
            if (!address) {
                return res.render('addAdress', { messages: 'Invalid address provided',name,address,city,state,pincode,phone,email });
            }
            if (!city || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(city)) {
                return res.render('addAdress', { messages: 'Invalid city provided',name,address,city,state,pincode,phone,email });
            }
            if (!state || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(state)) {
                return res.render('addAdress', { messages: 'Invalid state provided',name,address,city,state,pincode,phone,email });
            }
            const mobileRegex = /^\d{10}$/;
            if(!mobileRegex.test(phone)){
               return res.render('addAdress',{messages:'invalid mobilenumber',name,address,city,state,pincode,phone,email})
            }
            const pincodeRegex = /^\d{6}$/;
            if(!pincodeRegex.test(pincode)){
                return res.render('addAdress',{messages:'invalid pincode,pincode must be 6 digits',name,address,city,state,pincode,phone,email})
             }
            const emailRegex = /^[A-Za-z0-9.%+-]+@gmail\.com$/;
            if(!emailRegex.test(email)){
                return res.render('addAdress',{messages:'invalid email provided',name,address,city,state,pincode,phone,email})
             }

            userAddress.addresses.push({name:name,address:address,city:city,state:state,pincode:pincode,phone:phone,email:email})
            await userAddress.save()
        }
        

        res.redirect('/profile')
        
    } catch (error) {
        console.log(error);
    }
}
const removeAddress = async(req,res)=>{
    try {
        
        const addressId = req.body.addressId;
        const addressData = await Address.findOne({user:req.session.user_id})
        const index = addressData.addresses.find((value)=>value._id.toString()===addressId)
        if (index) {
            addressData.addresses.splice(index, 1);
            await addressData.save();
        }


        res.status(200).json({message:'succes'})

        
    } catch (error) {
        console.log(error);
    }
}

//edit address load
const loadEditAddress = async(req,res)=>{
    try {
        const addressId = req.query.id;
        const addressData = await Address.findOne({user:req.session.user_id})
        const index = addressData.addresses.find((value)=>value._id.toString()===addressId)
        if(index){
        res.render('editAddress',{index})
        }
        
    } catch (error) {
        console.log(error);
    }
}


const updateAddress = async(req,res)=>{
    try {

        const {name,address,city,pincode,state,phone,email,addressId} = req.body;
        

        const addressData = await Address.findOne({user:req.session.user_id})
        const got = await Address.findOne({"addresses._id": addressId })        
        const updateAddress = await Address.findOneAndUpdate(  {
            "addresses._id": addressId 
        },{ 
            $set:{
                "addresses.$.name": name,
                "addresses.$.address": address,
                "addresses.$.city": city,
                "addresses.$.pincode": pincode,
                "addresses.$.state": state,
                "addresses.$.phone": phone,
                "addresses.$.email": email

            }
        })
        res.status(200).json({message:'success'})

    } catch (error) {
        console.log(error);
    }
}

//edit profile

const editProfile = async(req,res)=>{
    try {
        const {name,email,mobile,userId}=req.body;
        const existingProfile = await users.findOne({ email: email });
        
        console.log('----------------'+existingProfile+'-------');
        const editProfile = await users.findByIdAndUpdate({_id:req.body.userId},{$set:{name:req.body.name,email:req.body.email,mobile:req.body.mobile}})
        res.status(200).json({message:'success'})
    } catch (error) {
        console.log(error);
    }
}




//signout
const signout = async(req,res)=>{
    try {
        req.session.destroy()
        res.redirect('/')
        
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
    signout,
    resendotp,
    loadproduct,
    googleInsert,
    failureLogin,
    productDetail,
    shop,
    cartLoad,
    //user adress*******************************
    loadNewAdress,
    addAddress,
    removeAddress,
    loadEditAddress,
    updateAddress,
    //edit profile===================
    editProfile
    
    
    
   
  
   
}