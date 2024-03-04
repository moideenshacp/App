const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { query } = require('express');


const loadLogin = async(req,res)=>{
    try {
        res.render('login')

        
    } catch (error) {
        console.log(error.message);
        
    }
}
module.exports = {
    loadLogin
}