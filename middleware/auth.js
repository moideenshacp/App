const users = require('../models/userModel');
const isLogin = async (req, res, next) => {
    try {
if (!req.session.user_id) {
            res.redirect('/login')
        }
        else {
            next()
        }

    } catch (erorr) {
        console.log(erorr.message)
    }
}

const isLogout = async (req, res, next) => {
    try {
if (req.session.user_id) {
            res.redirect('/home')
        } else {
            next()
        }

    } catch (erorr) {
        console.log(erorr.message)
    }
}


module.exports = {
    isLogin,
    isLogout,
 
}

