const users = require('../models/userModel');
const categories =  require('../models/category')
const bcrypt = require('bcrypt');
const { query } = require('express');
const { emit } = require('../app');
const { TopologyClosedEvent } = require('mongodb');





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

        const userslist = await users.find({});
        
 
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
        const Id = req.params.Id;
        // console.log(Id);
        const user = await users.findById(Id);
        
        if(user.is_blocked === true){
            await users.updateOne({_id:Id},{is_blocked:false})
        }else{
            await users.updateOne({_id:Id},{is_blocked:true})
        }
     
        res.redirect('/admin/customers')
        
    } catch (error) {
        console.error(error.message);
       
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

//addproduct
const addproduct =  async(req,res)=>{
    try {
        res.render('addproduct')
        
    } catch (error) {
        console.log(error.message);
    }
}

//catogory
const category =  async(req,res)=>{
    try {
        const categorylist = await categories.find({})
        res.render('category',{categorylist})
        
    } catch (error) {
        console.log(error.message);
    }
}

//product list
const products = async(req,res)=>{
    try {
        res.render('productlist')
        
    } catch (error) {
        console.log(error.message);
    }
}

//add category
const addcategory = async (req, res) => {
    try {
        const name = req.body.name.trim();
        const description = req.body.description;
        const lowercase = name.toLowerCase()

        if (!name || /^\s*$/.test(name)) {
            const categorylist = await categories.find({});
            return res.render('category', { categorylist, message: 'Invalid Name Provided' });
        }

        const existingCategory = await categories.findOne({ name:{$regex:'^'+lowercase+'$',$options:'i'}});

        if (existingCategory) {

            const categorylist = await categories.find({});
            return res.render('category', { categorylist, message: 'Category already exists.' });
        }

        const category = new categories({
            name: name,
            description: description
        });

        const categoryData = await category.save();

        if (categoryData) {
            const categorylist = await categories.find({});
            return res.render('category', { categorylist, message: 'Category added successfully.' });
        }
    } catch (error) {
        console.log(error.message);

    }
};

//edit categoryload

const editCategoryLoad = async(req,res)=>{
    try {

        const categorylist = await categories.find({});
        const id = req.query.id;
        const categoryData = await categories.findById({_id:id})
        console.log(categoryData);
        if(categoryData){
            res.render('editcategory',{categoryData})
        }else{
            res.redirect('/admin/category')
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

//editing
const editcategory = async(req,res)=>{
    try {
        
        
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
    block,
    addproduct,
    category,
    products,
    addcategory,
    editCategoryLoad
  
}