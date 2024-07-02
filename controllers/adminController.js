const users = require('../models/userModel');
const categories = require('../models/category')
const products = require('../models/product')
const cart = require('../models/cart')
const bcrypt = require('bcrypt');
const { query } = require('express');
const Product = require('../models/product')
const Wallet = require('../models/walletHistory')
const path = require('path')
const Address = require('../models/address');
const Order = require('../models/order')
const multer = require('multer')

const { TopologyClosedEvent } = require('mongodb');
const { model } = require('mongoose');

const { parseISO, format, startOfToday, startOfYesterday, subWeeks, subMonths, subYears, startOfWeek, endOfWeek, startOfMonth, startOfYear, endOfDay, startOfDay, isWithinInterval, addDays, subDays, isSameDay, getYear } = require('date-fns');

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
            totalDiscount =0;
            orderlist.forEach(order => {
                order.products.forEach(product => {
                    if (product.status=='delivered'||product.status=='Return Denied') {
                        if(product.product.offerprice>0){
                             totalSalesAmount += product.quantity * product.product.offerprice;

                        }else{
                         totalSalesAmount += product.quantity * product.product.price;

                          }
                       deliveredProductCount += 1;
                           
                    } else if(product.status == 'delivered'||product.status=='Return Denied'){
                        if(product.product.offerprice>0){
                        totalDiscount+=order.totalAmount-(product.quantity * product.product.offerprice)
                    }else{
                        totalDiscount+=order.totalAmount-(product.quantity * product.product.price)

                    }
               }
                })
                
            })
            const topSellingProducts = await Product.find({ sales: { $gt: 0 } })
                .sort({ sales: -1 })
                .limit(5)

            const topSellingCategories = await Product.aggregate([
                {
                    $group: {
                        _id: "$category",
                        totalSales: { $sum: "$sales" }
                    }
                },
                {
                    $sort: { totalSales: -1 }
                },
                {
                    $limit: 3
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'categoryDetails'
                    }
                },
                {
                    $unwind: '$categoryDetails'
                },
                {
                    $project: {
                        _id: 1,
                        totalSales: 1,
                        'categoryDetails.name': 1,
                    }
                }
            ]);

                console.log(topSellingCategories,'12365489');
            res.render('adminHome', { totalSalesAmount, deliveredProductCount,totalDiscount,topSellingProducts,topSellingCategories })
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 3;
        const skip = (page - 1) * limit;
        const userslist = await users.find({}).skip(skip).limit(limit);

        const totalUsers = await users.countDocuments();
        const totalPages = Math.ceil(totalUsers / limit);
        res.render('customers', { users: userslist, currentPage: page, limit, totalPages })

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
        req.session.admin_id = null;
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


        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const productlist = await products.find({}).populate('category').skip(skip).limit(limit)
        const categorylist = await categories.find({})
        const totalProducts = await products.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);
        res.render('productlist', { productlist, currentPage: page, limit, totalPages })

    } catch (error) {
        console.log(error.message);
    }
}

//add category
const addcategory = async (req, res) => {
    try {
        const name = req.body.name.trim();
        const offerPrice = req.body.offerPrice;
        console.log(offerPrice,'offerrrrrrrrrrrrrrrrrr');
        const description = req.body.description.trim();
        const lowercase = name.toLowerCase()

        const parsedOfferPrice = offerPrice ? parseFloat(offerPrice) : 0;

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

        if (parsedOfferPrice !== 0 && (isNaN(parsedOfferPrice) || parsedOfferPrice < 1 || parsedOfferPrice > 100)) {
            const categorylist = await categories.find({});
            return res.render('category', {categorylist, messages: 'Invalid discount provided. It must be a percentage between 1 and 100.'});
        }

        const category = new categories({
            name: name,
            description: description,
            offerprice:parsedOfferPrice

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
        const offerPrice = req.body.offerPrice;
        const lowercase = name.toLowerCase();
        const parsedDiscount = offerPrice ? parseFloat(offerPrice) : 0;

        if (!name || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(name)) {
            return res.render('editcategory', { categoryData, message: 'Invalid Name Provided' });
        }
        if (!description || /^\s*$/.test(description)) {
            return res.render('editcategory', { categoryData, message: 'Invalid description Provided' });
        }
        if (parsedDiscount !== 0 && (isNaN(parsedDiscount) || parsedDiscount < 1 || parsedDiscount > 100)) {
            return res.render('editcategory', {categoryData, messages: 'Invalid discount provided. It must be a percentage between 1 and 100.'});
        }

        const existingCategory = await categories.findOne({ name: { $regex: '^' + lowercase + '$', $options: 'i' } });

        if (existingCategory && existingCategory._id.toString() !== id) {
            return res.render('editcategory', { categoryData, message: 'Category name already exists.' });
        }

        const updatedCategory = await categories.findByIdAndUpdate(id, { $set: { name: lowercase, description: description,offerprice:parsedDiscount } })
        res.redirect('/admin/category')



    } catch (error) {
        console.log(error.message);

    }
};

//add product

const productAdd = async (req, res) => {
    try {


        const { name, description, price, quantity, category,offerPrice } = req.body;
        const images = req.files;

        const newImage = images.map(images => images.filename)


        const categorylist = await categories.find({})
        if (!req.files || req.files.length !== 4) {
            const categorylist = await categories.find({});

            return res.render('addproduct', { categorylist, message: 'Select Exactly Four Images', name, description, price, quantity, category,offerPrice });
        }


        if (!name || !/^[a-zA-Z][a-zA-Z\s]{1,}$/.test(name)) {
            const categorylist = await categories.find({});
            return res.render('addproduct', { categorylist, message: 'Invalid Name Provided', name, description, price, quantity, category,offerPrice  });
        }

        if (!description || /^\s*$/.test(description)) {
            const categorylist = await categories.find({});
            return res.render('addproduct', { categorylist, message: 'Invalid description Provided', name, description, price, quantity, category,offerPrice  });
        }

        if (isNaN(price) || price <= 0) {
            return res.render('addproduct', { categorylist, message: 'Price is not valid', name, description, price, quantity, category,offerPrice  });
        }
        if (offerPrice && (isNaN(offerPrice) || offerPrice <= 0)) {
            return res.render('addproduct', { categorylist, message: 'Offer Price is not valid', name, description, price, quantity, category, offerPrice });
        }
        if (isNaN(quantity) || quantity < 0) {
            return res.render('addproduct', { categorylist, message: 'quantity is not valid', name, description, price, quantity, category,offerPrice  });
        }



        const productDetail = new products({
            name: name.trim(),
            description: description.trim(),
            price: parseFloat(price),
            offerprice:offerPrice ? parseFloat(offerPrice) : 0, 
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
        console.log(images,'imaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');

        

        const name = req.body.name.trim();
        const description = req.body.description.trim();
        const price = req.body.price;
        const offerPrices = req.body.offerPrice
        const quantity = req.body.quantity;
        const category = req.body.category;
        console.log(category);
        const offerPrice = offerPrices ? offerPrices : 0;

        const categoryDocument = await categories.findOne({ name: category });
        const categoryId = categoryDocument ? categoryDocument._id : null;
        console.log(categoryId);





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
        if (offerPrice && (isNaN(offerPrice) || offerPrice <= 0)||offerPrice>price) {
            const productData = await products.findById({ _id: id })
            const categorylist = await categories.find({})
            return res.render('editproduct', { categorylist,productData, message: 'Offer Price is not valid or offerPrice is greater than originl price'});
        }
        if (isNaN(quantity) || quantity < 0) {
            const productData = await products.findById({ _id: id })
            const categorylist = await categories.find({})
            return res.render('editproduct', { categorylist, productData, message: 'quantity is not valid' });
        }




        // const updatedProduct = await products.findByIdAndUpdate(id, { $set: { name: name, description: description, price: price, quantity: quantity, category: categoryId,offerprice: offerPrice } })
        productData.name =name;
        productData.description =description;
        productData.price =price;
        productData.quantity =quantity;
        productData.category =categoryId;
        productData.offerprice =offerPrice;
            
        if (images && images.length > 0) {
            images.forEach((item, index) => {
                if (index < 4) { // Assuming you have up to 4 image slots
                    productData.image[index] = item.filename;
                }
            });
        }

       const savedProduct = await productData.save()
       if(savedProduct){console.log('sucess')}else{
        console.log('not okay');
       }

        res.redirect('/admin/products')

    } catch (error) {
        console.log(error);
    }
}

//order
const loadOrder = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 3;
        const skip = (page - 1) * limit;
        const orderlist = await Order.find().populate('products.product').populate('user').sort({date:-1}).skip(skip).limit(limit);

        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit);
        res.render('order', { orderlist, currentPage: page, totalPages, limit })
    } catch (error) {
        console.log(error);
    }
}

//load order detail
const orderDetail = async (req, res) => {
    try {
        const userId = req.query.userId;
        const productId = req.query.productId;
        const orderId = req.query.orderId;
        const orderData = await Order.findOne({_id:orderId}).populate('address.addresses')   
        const orders = await Order.find({user:userId}).populate('products.product')
        const address = await Address.findOne({user:userId})

        console.log('User ID:', userId);
        let orderProduct = null;
        orders.forEach(order => {
            order.products.forEach(product => {
                if (product.product._id.toString() === productId) {
                    orderProduct = product;
                }
            });
        });
        let orderAddress = null;
        address.addresses.forEach(add=>{
            if(add._id.toString()===orderData.address.toString()){
                orderAddress=add
            }
        })
        const formattedDate = orderData.date.toLocaleString('en-US', { timeZone: 'UTC' });

        res.render('orderDetail', { orderProduct, orders, orderData, formattedDate, orderAddress })

    } catch (error) {
        console.log(error);
    }
}

const statusChange = async (req, res) => {
    try {
        let dataIndex = 0;
        const { orderId, productId ,userId} = req.query;
        const action = req.query.action;
        const productFind = await Product.findOne({ _id: productId })
        console.log(productId + '11111111111111111111110');
        const orderData = await Order.find({ user: userId })
        for (i = 0; i < orderData.length; i++) {
            if (orderData[i].products.find(product => product.product.toString() === productId)) {
                var orderProduct = orderData[i].products.find(product => product.product.toString() === productId)
                dataIndex = i;
            };

        }
        
        if (action === 'cancelled') {

            orderProduct.status = 'cancelled';

            await orderData[dataIndex].save();
            const productData = await products.findById(orderProduct.product);

            productData.quantity += orderProduct.quantity;
            productData.sales -= orderProduct.quantity;


            await productData.save();
            if (orderData[dataIndex].paymentMethod === 'Razorpay' || orderData[dataIndex].paymentMethod === 'Wallet') {
                const user = await users.findById(userId);
                user.wallet += productFind.price * orderProduct.quantity;
                await user.save();
                const refundAmount = productFind.price * orderProduct.quantity

                const walletTransaction = new Wallet({
                    user: userId,
                    amount: refundAmount,
                    type: 'credit',
            });
            await walletTransaction.save();
            }
        } else if (action === 'delivered') {
            orderProduct.status = 'delivered'
            await orderData[dataIndex].save();

        } else {
            throw new Error('Invalid action type');
        }
        res.redirect('/admin/order')


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

const returnOrder = async (req, res) => {
    try {
        let dataIndex = 0
        const { orderId, productId ,userId} = req.query;
        const action = req.query.action;
        const productFind = await Product.findOne({ _id: productId })
        const orderData = await Order.find({ user: userId })
        for (i = 0; i < orderData.length; i++) {
            if (orderData[i].products.find(product => product.product.toString() === productId)) {
                var orderProduct = orderData[i].products.find(product => product.product.toString() === productId)
                dataIndex = i;
            };

        }
        if (action === 'accept') {

            orderProduct.status = 'Returned';

            await orderData[dataIndex].save();
            const productData = await products.findById(orderProduct.product);

            productData.quantity += orderProduct.quantity;
            productData.sales -= orderProduct.quantity;


            await productData.save();
            console.log(orderData[dataIndex].paymentMethod, 'payyyyyyyyyyyyyyyyyyyyy');

            if (orderData[dataIndex].paymentMethod === 'Razorpay' || orderData[dataIndex].paymentMethod === 'Wallet') {
                const user = await users.findById(userId);
                if(productFind.offerprice>0){

                
                user.wallet += productFind.offerprice * orderProduct.quantity;
                }else{
                    user.wallet += productFind.price * orderProduct.quantity;

                }
                await user.save();
                if(productFind.offerprice>0){
                var refundAmount = productFind.offerprice * orderProduct.quantity
                }else{
                    var refundAmount = productFind.price * orderProduct.quantity

                }
                const walletTransaction = new Wallet({
                    user: userId,
                    amount: refundAmount,
                    type: 'credit',
            });
            await walletTransaction.save();
            }
        } else if (action === 'deny') {
            console.log('1234789');
            orderProduct.status = 'Return Denied'
            await orderData[dataIndex].save();

        } else {
            throw new Error('Invalid action type');
        }
        res.redirect('/admin/order')

    } catch (error) {
        console.log(error);
    }
}


//sort sale
const sortSales = async (req, res) => {
    try {
        const { selectedValue, dateRangeStart, dateRangeEnd } = req.body;
        console.log(dateRangeStart);
        console.log(selectedValue);

        let orderlist = [];
        const categoryData = await categories.find();

        // Calculate date range based on selectedValue
        let startDate, endDate;
        const currentDate = new Date();

        switch (selectedValue) {
            case 'daily':
                startDate = new Date(currentDate);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(currentDate);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'weekly':
                startDate = new Date(currentDate);
                startDate.setDate(startDate.getDate() - 7);
                endDate = new Date(currentDate);
                break;
            case 'monthly':
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                break;
            case 'yearly':
                startDate = new Date(currentDate.getFullYear(), 0, 1);
                endDate = new Date(currentDate.getFullYear(), 11, 31);
                break;
            case 'custom':
                startDate = new Date(dateRangeStart);
                endDate = new Date(dateRangeEnd);
                break;
            default:
                startDate = new Date(currentDate);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(currentDate);
                endDate.setHours(23, 59, 59, 999);
                break;
        }
        let totalSalesAmount = 0;
        let deliveredProductCount = 0;


        orderlist = await Order.find({ date: { $gte: startDate, $lte: endDate } })
            .populate('products.product')
            .populate('user');


        orderlist.forEach(order => {
            order.products.forEach(product => {
                if (product.status === 'delivered'||product.status === 'Return Denied') {
                    totalSalesAmount += product.quantity * product.product.price;
                    deliveredProductCount += 1;
                }
            });
        });

        console.log(orderlist);
        console.log(totalSalesAmount)
        console.log(deliveredProductCount);
        res.status(200).json({ message: 'success', orderlist, categoryData, totalSalesAmount, deliveredProductCount });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'error' });
    }
};




const adminDataChart = async (req, res) => {
    try {
        const filter = req.query.filter;

        let data;

        switch (filter) {
            case 'daily':
                data = await getDailyData();
                break;
            case 'weekly':
                data = await getWeeklyData();
                break;
            case 'monthly':
                data = await getMonthlyData();
                break;
            case 'yearly':
                data = await getYearlyData();
                break;
            default:
                data = await getMonthlyData();
                break;
        }

        res.json(data);

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    };
};

async function getDailyData() {
    const today = new Date();
    const startDate = startOfDay(subDays(today, 6)); // Start from 6 days ago
    const endDate = endOfDay(today);
    const orderlist =await  Order.find({})
    let orderData=[]
    let deliveredProductCount=0;


    orderlist.forEach(order => {
        if (order.date >= startDate && order.date <= endDate) {
            order.products.forEach(product => {
                if (product.status === 'delivered'||product.status === 'Return Denied') {
                    orderData.push(order);
                }
            });
        }
    });

    // Get the current day of the week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Generate labels array for the past 7 days
    const labels = Array.from({ length: 7 }, (_, index) => {
        const date = subDays(today, 6 - index); // Get the date for each of the past 7 days
        return format(date, 'EEEE'); // Format the date to get the day of the week
    });

    const data = labels.map((day, index) => {
        const date = startOfDay(subDays(today, 6 - index)); // Get the start of the day for each of the past 7 days
        const filteredOrders = orderData.filter(order => {
            const orderDay = startOfDay(order.date);
            return isSameDay(orderDay, date);
        });
        return filteredOrders.length;
    });

    return { labels,data };
};


async function getWeeklyData() {
    const today = new Date();
    const startDate = startOfWeek(subWeeks(today, 3)); // Start from the beginning of the first week in the range
    const endDate = endOfDay(today); // End with today
    const orderlist =await  Order.find({})
    let orderData=[]
    let deliveredProductCount=0;


    orderlist.forEach(order => {
        if (order.date >= startDate && order.date <= endDate) {
            order.products.forEach(product => {
                if (product.status === 'delivered'||product.status === 'Return Denied') {
                    orderData.push(order);
                }
            });
        }
    });

    const labels = Array.from({ length: 4 }, (_, index) => {
        const startOfWeekDate = startOfWeek(subWeeks(today, 3 - index)); // Calculate the start of each week
        const endOfWeekDate = endOfWeek(startOfWeekDate); // Calculate the end of each week
        return `${format(startOfWeekDate, 'MMM d')} - ${format(endOfWeekDate, 'MMM d')}`; // Format the date range
    });

    const data = labels.map((weekLabel, index) => {
        const startOfWeekDate = startOfWeek(subWeeks(today, 3 - index)); // Calculate the start of each week
        const endOfWeekDate = endOfWeek(startOfWeekDate); // Calculate the end of each week
        const filteredOrders = orderData.filter(order => {
            const orderDate = startOfDay(order.date);
            return isWithinInterval(orderDate, { start: startOfWeekDate, end: endOfWeekDate });
        });
        return filteredOrders.length;
    });

    return { labels, data };
};

async function getMonthlyData() {
    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfDay(today);
    const orderlist =await  Order.find({})
    let orderData=[]
    let deliveredProductCount=0;


    orderlist.forEach(order => {
        if (order.date >= startDate && order.date <= endDate) {
            order.products.forEach(product => {
                if (product.status === 'delivered'||product.status === 'Return Denied') {
                    orderData.push(order);
                }
            });
        }
    });

    const labels = Array.from({ length: 12 }, (_, index) => {
        const month = startOfMonth(subMonths(today, index));
        return format(month, 'MMMM');
    }).reverse();
    const data = labels.map(month => {
        const filteredOrders = orderData.filter(order => {
            const orderMonth = startOfMonth(order.date);
            return format(orderMonth, 'MMMM') === month;
        });
        return filteredOrders.length;
    });

    return { labels, data };
};

async function getYearlyData() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const startDate = startOfYear(subYears(today, 4)); // Start date 4 years ago to include 5 years of data
    const endDate = endOfDay(today);
    const orderlist =await  Order.find({})
    let orderData=[]
    let deliveredProductCount=0;


    orderlist.forEach(order => {
        if (order.date >= startDate && order.date <= endDate) {
            order.products.forEach(product => {
                if (product.status === 'delivered'||product.status === 'Return Denied') {
                    orderData.push(order);
                }
            });
        }
    });


    // Generate labels for the past 5 years, starting from 4 years ago to the current year
    const labels = Array.from({ length: 5 }, (_, index) => String(currentYear - 4 + index));

    const data = labels.map(year => {
        const filteredOrders = orderData.filter(order => {
            const orderYear = getYear(order.date); // Get the year of the order date
            return String(orderYear) === year;
        });
        return filteredOrders.length;
    });

    return { labels, data };
};



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
    statusChange,
    statusCancelled,

    //sales report
    salesReportLoad,
    returnOrder,
    sortSales,
    adminDataChart

}