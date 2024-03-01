// const { name } = require('ejs');
// const User = require('../models/userModel');
// const bcrypt = require('bcrypt');


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




module.exports= {
    loadHome,
    loadLogin,
  
}