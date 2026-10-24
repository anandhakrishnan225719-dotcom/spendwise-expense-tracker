const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    amount: { type: Number, required: true, min: 0.01 },
    category: {
      type: String,
      required: true,
      enum: ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'],
    },
    date: { type: Date, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'expense',
  }
);

module.exports = mongoose.model('Expense', expenseSchema);