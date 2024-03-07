const users = require('../models/userModel');
const bcrypt = require('bcrypt');
const { query } = require('express');
const { emit } = require('../app');





//password hash
const securePassword =  async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;
        
    } catch (error) {
        console.log(error.message);
        
    }
}



//load login
const loadLogin = async(req,res)=>{
    try {
        res.render('adminLogin')

        
    } catch (error) {
        console.log(error.message);
        
    }
}

//verify login
const verifyLogin = async(req,res)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;
        // console.log(email);


      
        const userData = await users.findOne({email:email});
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);

            if(passwordMatch){
                if(userData.is_admin === 0){
                    res.render('adminLogin',{message:'Invalid Email and Password'})
                }else{
                    req.session.admin_id = userData._id;
                    res.redirect('/admin/home')

                }
               
            }
            else{
                res.render('adminLogin',{message:'Invalid Email and Password'})
            }
        }
        else{
            res.render('adminLogin',{message:'Invalid Email and Password'})
        }
        
    } catch (error) {
        console.log(error.message);
        
    }
}

//load dashboard

const loadHome = async(req,res)=>{
    try {
        if(req.session.admin_id){
        res.render('adminHome')
        }else{
            res.redirect('/admin')
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

//customers
const customers = async(req,res)=>{
    try {

        const userslist = await users.find({},'email name _id');
        
 
        res.render('customers',{users:userslist})
        
    } catch (error) {
        console.log(error.message);
    }
}

//block
// const block = async(req,res)=>{
//     try {
//         const userId = req.params.userId;
        
//         const user = await users.findById(userId);
//         console.log(user);
//         if(!user){
//             res.status(404).json({success:false,message:'User not found'})
//         }
//         const userData = await users.findByIdAndUpdate({_id:req.params.id},{$set:{is_blocked:true}})
//         await userData.save();
//         // res.redirect('/admin/customers')
//         // user.is_blocked = !user.is_blocked;
        

        
//     } catch (error) {
//         console.log(error.message);
//     }
// }

const block =  async (req, res) => {
    try {
        const userId = req.query._id;
        const user = await users.findById(userId);
        if(user.is_blocked === true){
            await users.updateOne({_id:userId},{is_blocked:false})
        }else{
            await users.updateOne({_id:userId},{is_blocked:true})
        }
        res.redirect('/admin/customers')
        
    } catch (error) {
        console.error('Error:', error);
       
    }
};


//logout
const logout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/admin')
        
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loadLogin,
    verifyLogin,
    loadHome,
    logout,
    customers,
    block
  
}