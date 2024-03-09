
const isLogin = async (req, res, next) => {
    try {
        
        if (req.session.admin_id) { }
        else {
            res.redirect('/admin')
        }
        next()
    } catch (erorr) {
        console.log(erorr.message)
    }
}

const isLogout = async (req, res, next) => {
    try {
 if (req.session.admin_id) {
            res.redirect('/admin/home')
        } else {
            next()

        }
    } catch (erorr) {
        console.log(erorr.message)
    }
}


module.exports = {
    isLogin,
    isLogout
}