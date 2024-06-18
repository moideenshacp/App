const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);

