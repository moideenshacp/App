// const { name } = require('ejs');
const users = require('../models/userModel');
const bcrypt = require('bcrypt');




//hashpassword
const securePassword = async(password)=>{
try {
    const passwordHash = await bcrypt.hash(password,10)
    return passwordHash;
    
} catch (error) {
    console.log(error.message);   
}

}


//for loading homepage
const loadHome = async(req,res)=>{
    try{
        res.render('home')
    }catch(error){
        console.log(error.messege);
    }
}

//for loading loginpage
const loadLogin = async(req,res)=>{
    try {
        res.render('login')
        
    } catch (error) {
        console.log(error.messege);
    }
}

const insertUser = async(req,res)=>{
    try {
        
        const checkmail = await users.findOne({email:req.body.email})
        if (checkmail) {
            res.render('login',{message:'email already exist'})

        } else {
            const spassword  = await securePassword(req.body.password)
            const name = req.body.name.trim();
            if (!name || !/^[a-zA-Z][a-zA-Z\s]*$/.test(name)) {
                return res.render('login', { message: 'Invalid name provided' });
            }
            const email =req.body.email;
            const emailRegex = /^[A-Za-z0-9.%+-]+@gmail\.com$/;
    
            // Check if the email is valid
            if (!emailRegex.test(email)) {
                return res.render('login', { message: 'Invalid email provided' });
            }
            const user = new users({
                name:req.body.name,
                email:req.body.email,
                password:req.body.password,
                mobile:req.body.mobile
    
            });
    
            const userdata  = await user.save();  
            if(userdata){
                res.render('login',{message:'successful'})
            }else{
                res.render('login',{message:'failed'})
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
    
        const useremail = await users.findOne({email:email})
        const userpass = await users.findOne({password:password})

        if(useremail && userpass){
            res.render('home')
        }else{
            res.send('invalid')
        }
        
    } catch (error) {
        console.log(error.message);
    }
   
}






module.exports= {
    loadHome,
    loadLogin,
    insertUser,
    verify
  
}