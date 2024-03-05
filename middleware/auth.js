
const isLogin = async (req, res, next) => {
    try {
        if (req.session.admin_id) {
            res.redirect('/admin')
        }
        else if (!req.session.user_id) {
            res.redirect('/home')
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
        if (req.session.admin_id) {
            res.redirect('/admin')
        }
        else if (req.session.user_id) {
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
    isLogout
}

