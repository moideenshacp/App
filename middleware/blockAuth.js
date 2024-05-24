const users = require('../models/userModel')
const block = async(req,res,next)=>{
    try {
        const userDatas = await users.findById({_id:req.session.user_id })
        console.log('-=============================',userDatas)
        if(userDatas.is_blocked === true){
            req.session.user_id = null,
            res.redirect('/login')
        }else{
            next()
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    block
}