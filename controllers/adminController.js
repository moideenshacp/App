const users = require('../models/userModel');
const categories = require('../models/category')
const products = require('../models/product')
const cart = require('../models/cart')
const bcrypt = require('bcrypt');
const { query } = require('express');
const path = require('path')
const Address = require('../models/address');
const Order = require('../models/order')

const multer = require('multer')

const { TopologyClosedEvent } = require('mongodb');
const { model } = require('mongoose');



//multer

const storage = multer.diskStorage({
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
    destination: "../public/productImages/productImages",
});

const upload = multer({ storage: storage, limits: { files: 4 }, preservePath: true }).array('image', 4);






//password hash
const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;

    } catch (error) {
        console.log(error.message);

    }
}



//load login
const loadLogin = async (req, res) => {
    try {
        res.render('adminLogin')


    } catch (error) {
        console.log(error.message);

    }
}

//verify login
const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;



        const userData = await users.findOne({ email: email });
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                if (userData.is_admin === 0) {
                    res.render('adminLogin', { message: 'Invalid Email and Password' })
                } else {
                    req.session.admin_id = userData._id;
                    res.redirect('/admin/home')

                }

            }
            else {
                res.render('adminLogin', { message: 'Invalid Email and Password' })
            }
        }
        else {
            res.render('adminLogin', { message: 'Invalid Email and Password' })
        }

    } catch (error) {
        console.log(error.message);

    }
}

//load dashboard

const loadHome = async (req, res) => {
    try {
        if (req.session.admin_id) {
            const orderlist = await Order.find().populate('products.product')
            let totalSalesAmount = 0;
            let deliveredProductCount = 0;
            orderlist.forEach(order => {
                order.products.forEach(product => {
                    if (product.status == 'delivered') {

                        if (product.status == 'delivered') {
                            totalSalesAmount += product.quantity * product.product.price;
                            deliveredProductCount += 1;
                        }
                    }
                })
            })
            res.render('adminHome', { totalSalesAmount,deliveredProductCount })
        } else {
            res.redirect('/admin')
        }

    } catch (error) {
        console.log(error.message);
    }
}

//customers
const customers = async (req, res) => {
    try {

        const userslist = await users.find({});


        res.render('customers', { users: userslist })

    } catch (error) {
        console.log(error.message);
    }
}



const block = async (req, res) => {
    try {
        const Id = req.params.Id;
        // console.log(Id);
        const user = await users.findById(Id);

        if (user.is_blocked === true) {
            await users.updateOne({ _id: Id }, { is_blocked: false })
        } else {
            await users.updateOne({ _id: Id }, { is_blocked: true })
        }

        res.redirect('/admin/customers')

    } catch (error) {
        console.error(error.message);

    }
};


//logout
const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin')

    } catch (error) {
        console.log(error.message);
    }
}

//addproduct
const addproduct = async (req, res) => {
    try {

        const categorylist = await categories.find({})
        res.render('addproduct', { categorylist })

    } catch (error) {
        console.log(error.message);
    }
}

//catogory
const category = async (req, res) => {
    try {
        const categorylist = await categories.find({})
        res.render('category', { categorylist: categorylist })

    } catch (error) {
        console.log(error.message);
    }
}

//product list
const productList = async (req, res) => {
    try {
        const productlist = await products.find({}).populate('category');

        const categorylist = await categories.find({})
        res.render('productlist', { productlist })

    } catch (error) {
        console.log(error.message);
    }
}

//add category
const addcategory = async (req, res) => {
    try {
        const name = req.body.name.trim();
        const description = req.body.description.trim();
        const lowercase = name.toLowerCase()

        if (!name || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(name)) {
            const categorylist = await categories.find({});
            return res.render('category', { categorylist, message: 'Invalid Name Provided' });
        }

        const existingCategory = await categories.findOne({ name: { $regex: '^' + lowercase + '$', $options: 'i' } });

        if (existingCategory) {

            const categorylist = await categories.find({});
            return res.render('category', { categorylist, message: 'Category already exists.' });
        }
        if (!description || /^\s*$/.test(description)) {
            const categorylist = await categories.find({});
            return res.render('category', { categorylist, message: 'Invalid description Provided' });
        }


        const category = new categories({
            name: name,
            description: description

        });

        const categoryData = await category.save();

        if (categoryData) {
            const categorylist = await categories.find({});
            return res.render('category', { categorylist, messages: 'Category added successfully.' });
        }
    } catch (error) {
        console.log(error.message);

    }
};

//unlist /list 
const listCategory = async (req, res) => {
    try {
        const Id = req.params.Id;
        console.log(Id);
        const user = await categories.findById(Id);

        if (user.is_listed === true) {
            await categories.updateOne({ _id: Id }, { is_listed: false })
        } else {
            await categories.updateOne({ _id: Id }, { is_listed: true })
        }

        res.redirect('/admin/category')

    } catch (error) {
        console.error(error.message);

    }
};

//edit categoryload
const editCategoryLoad = async (req, res) => {
    try {


        const id = req.query.id;
        const categoryData = await categories.findById({ _id: id })
        if (categoryData) {
            res.render('editcategory', { categoryData })
        } else {
            res.redirect('/admin/category')
        }

    } catch (error) {
        console.log(error.message);
    }
}

//editing
const editcategory = async (req, res) => {
    try {
        const id = req.body.id;

        // console.log(id);
        const categoryData = await categories.findOne({ _id: id });
        console.log(categoryData + '------------------------------------------------------');

        const name = req.body.name.trim();
        const description = req.body.description.trim();
        const lowercase = name.toLowerCase();

        if (!name || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(name)) {
            return res.render('editcategory', { categoryData, message: 'Invalid Name Provided' });
        }
        if (!description || /^\s*$/.test(description)) {
            return res.render('editcategory', { categoryData, message: 'Invalid description Provided' });
        }

        const existingCategory = await categories.findOne({ name: { $regex: '^' + lowercase + '$', $options: 'i' } });

        if (existingCategory && existingCategory._id.toString() !== id) {
            return res.render('editcategory', { categoryData, message: 'Category name already exists.' });
        }

        const updatedCategory = await categories.findByIdAndUpdate(id, { $set: { name: lowercase, description: description } })
        res.redirect('/admin/category')



    } catch (error) {
        console.log(error.message);

    }
};

//add product

const productAdd = async (req, res) => {
    try {


        const { name, description, price, quantity, category } = req.body;
        const images = req.files;

        const newImage = images.map(images => images.filename)


        const categorylist = await categories.find({})
        if (!req.files || req.files.length !== 4) {
            const categorylist = await categories.find({});

            return res.render('addproduct', { categorylist, message: 'Select Exactly Four Images', name, description, price, quantity, category });
        }


        if (!name || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(name)) {
            const categorylist = await categories.find({});
            return res.render('addproduct', { categorylist, message: 'Invalid Name Provided', name, description, price, quantity, category });
        }

        if (!description || /^\s*$/.test(description)) {
            const categorylist = await categories.find({});
            return res.render('addproduct', { categorylist, message: 'Invalid description Provided', name, description, price, quantity, category });
        }

        if (isNaN(price) || price <= 0) {
            return res.render('addproduct', { categorylist, message: 'Price is not valid', name, description, price, quantity, category });
        }
        if (isNaN(quantity) || quantity <= 0) {
            return res.render('addproduct', { categorylist, message: 'quantity is not valid', name, description, price, quantity, category });
        }



        const productDetail = new products({
            name: name.trim(),
            description: description.trim(),
            price: parseFloat(price),
            quantity: parseFloat(quantity),
            category: category,
            image: newImage



        })
        const productData = await productDetail.save()
        if (productData) {
            res.render('addproduct', { categorylist, messages: 'added succesfully' })
        }
    }


    catch (error) {
        console.log(error.message);
    }

}
//list/unlist products

const listProduct = async (req, res) => {
    try {
        const Id = req.params.Id;
        console.log(Id);
        const user = await products.findById(Id);

        if (user.is_listed === true) {
            await products.updateOne({ _id: Id }, { is_listed: false })
        } else {
            await products.updateOne({ _id: Id }, { is_listed: true })
        }

        res.redirect('/admin/products')

    } catch (error) {
        console.error(error.message);

    }
};

//edit productload
const editProductLoad = async (req, res) => {
    try {


        const id = req.query.id;
        const productData = await products.findById({ _id: id }).populate('category');
        const productImage = await products.findById({ _id: id }, { image: 1, _id: 0 })
        const productImageArr = await productImage.image.map(image => `${image}`)
        const categorylist = await categories.find({})
        const productList = await products.find({})
        if (productData) {
            res.render('editproduct', { productData, categorylist, productList, productImageArr })
        } else {
            res.redirect('/admin/products')
        }

    } catch (error) {
        console.log(error.message);
    }
}

//edit product
const editProduct = async (req, res) => {
    try {

        const id = req.body.id;
        console.log(id + 'editttttttttttttttttttttttttttttttttttpr');


        const productData = await products.findOne({ _id: id });
        const images = req.files;
        const newImageNames = images.map(image => image.filename);


        const name = req.body.name.trim();
        const description = req.body.description.trim();
        const price = req.body.price;
        const quantity = req.body.quantity;
        const category = req.body.category;
        console.log(category);
        const editedImageIndex = req.body.editedImageIndex;

        const categoryDocument = await categories.findOne({ name: category });
        const categoryId = categoryDocument ? categoryDocument._id : null;
        console.log(categoryId);


        const updatedImages = [...productData.image];
        if (editedImageIndex !== undefined) {
            updatedImages[editedImageIndex] = newImageNames[0];
        }



        if (!name || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(name)) {
            const productData = await products.findById({ _id: id })
            const categorylist = await categories.find({})
            return res.render('editproduct', { productData, categorylist, message: 'Invalid Name Provided' });
        }
        if (!description || /^\s*$/.test(description)) {
            const productData = await products.findById({ _id: id })
            const categorylist = await categories.find({})
            return res.render('editproduct', { categorylist, productData, message: 'Invalid description Provided' });
        }
        if (isNaN(price) || price <= 0) {
            const productData = await products.findById({ _id: id })
            const categorylist = await categories.find({})
            return res.render('editproduct', { categorylist, productData, message: 'Price is not valid' });
        }
        if (isNaN(quantity) || quantity < 0) {
            const productData = await products.findById({ _id: id })
            const categorylist = await categories.find({})
            return res.render('editproduct', { categorylist, productData, message: 'quantity is not valid' });
        }




        const updatedProduct = await products.findByIdAndUpdate(id, { $set: { name: name, description: description, price: price, quantity: quantity, category: categoryId, image: updatedImages } })


        res.redirect('/admin/products')

    } catch (error) {
        console.log(error);
    }
}

//order
const loadOrder = async (req, res) => {
    try {
        const orderlist = await Order.find().populate('products.product')
        res.render('order', { orderlist })
    } catch (error) {
        console.log(error);
    }
}

//load order detail
const orderDetail = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.query.productId;
        const orderId = req.query.orderId;
        const orderData = await Order.findOne({ _id: orderId }).populate('address.addresses')
        const orders = await Order.find({ user: userId }).populate('products.product')
        const address = await Address.findOne({ user: userId })
        let orderProduct = null;
        orders.forEach(order => {
            order.products.forEach(product => {
                if (product.product._id.toString() === productId) {
                    orderProduct = product;
                }
            });
        });
        let orderAddress = null;
        address.addresses.forEach(add => {
            if (add._id.toString() === orderData.address.toString()) {
                orderAddress = add
            }
        })
        const formattedDate = orderData.date.toLocaleString('en-US', { timeZone: 'UTC' });

        res.render('orderDetail', { orderProduct, orders, orderData, formattedDate, orderAddress })

    } catch (error) {
        console.log(error);
    }
}

const statusDelivered = async (req, res) => {
    try {
        let dataIndex = 0
        const productId = req.body.productId;
        const userId = req.body.userId;
        console.log(productId + '11111111111111111111110');
        const orderData = await Order.find({ user: userId })
        for (i = 0; i < orderData.length; i++) {
            if (orderData[i].products.find(product => product.product.toString() === productId)) {
                var orderProduct = orderData[i].products.find(product => product.product.toString() === productId)
                dataIndex = i;
            };

        }
        if (orderProduct) {
            orderProduct.status = 'delivered';

            await orderData[dataIndex].save();

        }
        res.status(200).json({ message: 'succes' });



    } catch (error) {
        console.log(error);
    }
}

const statusCancelled = async (req, res) => {
    try {
        let dataIndex = 0
        const productId = req.body.productId;
        const userId = req.body.userId;
        console.log(productId + '1111111111111111111111');
        const orderData = await Order.find({ user: userId })
        for (i = 0; i < orderData.length; i++) {
            if (orderData[i].products.find(product => product.product.toString() === productId)) {
                var orderProduct = orderData[i].products.find(product => product.product.toString() === productId)
                dataIndex = i;
            };

        }
        if (orderProduct) {
            orderProduct.status = 'cancelled';

            await orderData[dataIndex].save();
            const productData = await products.findById(orderProduct.product);


            productData.quantity += orderProduct.quantity;

            await productData.save();

        }
        res.status(200).json({ message: 'succes' });



    } catch (error) {
        console.log(error);
    }
}

const salesReportLoad = async (req, res) => {
    try {
        const orderlist = await Order.find().populate('products.product').populate('user')

        res.render('salesReport', { orderlist })
    } catch (error) {
        console.log(error);
    }
}

const filterSale = async (req, res) => {
    try {
        const filter = req.query.filter;
        let dateRange;

        const now = new Date();
        if (filter === 'Daily') {
            dateRange = {
                $gte: new Date(now.setHours(0, 0, 0, 0)),
                $lt: new Date(now.setHours(23, 59, 59, 999))
            };
        } else if (filter === 'Weekly') {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
            dateRange = {
                $gte: new Date(startOfWeek.setHours(0, 0, 0, 0)),
                $lt: new Date(endOfWeek.setHours(23, 59, 59, 999))
            };
        } else if (filter === 'Yearly') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const endOfYear = new Date(now.getFullYear(), 11, 31);
            dateRange = {
                $gte: new Date(startOfYear.setHours(0, 0, 0, 0)),
                $lt: new Date(endOfYear.setHours(23, 59, 59, 999))
            };
        }

        // Assuming you're using Mongoose to interact with MongoDB
        Order.find({ 'date': dateRange })
            .populate('user')
            .populate('products.product')
            .then(orders => res.json(orders))
            .catch(error => res.status(500).json({ error: error.message }));

    } catch (error) {
        console.log(error);
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
    productList,
    addcategory,
    editCategoryLoad,
    editcategory,
    listCategory,
    productAdd,
    listProduct,
    editProductLoad,
    editProduct,
    //order------------------------------------------------------------------------
    loadOrder,
    orderDetail,
    statusDelivered,
    statusCancelled,
    salesReportLoad,
    filterSale

}