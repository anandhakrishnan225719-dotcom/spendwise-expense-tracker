const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Expense = require('./models/Expense');
const auth = require('./middleware/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
}));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));

function validateExpense(body = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const amount = Number(body.amount);
  const date = new Date(body.date);

  if (!name || name.length > 60) {
    return { error: 'Enter an expense name (up to 60 characters).' };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'Enter an amount greater than zero.' };
  }
  if (!categories.includes(body.category)) {
    return { error: 'Choose a valid category.' };
  }
  if (!body.date || Number.isNaN(date.getTime())) {
    return { error: 'Enter a valid date.' };
  }

  return { value: { name, amount, category: body.category, date } };
}

app.get('/api/health', (request, response) => {
  response.json({ message: 'Expense Tracker API is running' });
});

// All expense routes below require a valid login token.
app.get('/api/expenses', auth, async (request, response) => {
  try {
    const expenses = await Expense.find({ user: request.userId }).sort({ date: -1 });
    response.json(expenses);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: 'Could not load expenses.' });
  }
});

app.post('/api/expenses', auth, async (request, response) => {
  const result = validateExpense(request.body);
  if (result.error) return response.status(400).json({ message: result.error });

  try {
    const expense = await Expense.create({
      ...result.value,
      user: request.userId,
    });
    response.status(201).json(expense);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: 'Could not save expense.' });
  }
});

app.patch('/api/expenses/:id', auth, async (request, response) => {
  const result = validateExpense(request.body);
  if (result.error) return response.status(400).json({ message: result.error });

  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: request.params.id, user: request.userId },
      result.value,
      { new: true, runValidators: true }
    );

    if (!expense) return response.status(404).json({ message: 'Expense not found.' });
    response.json(expense);
  } catch (error) {
    const status = error.name === 'CastError' ? 400 : 500;
    response.status(status).json({ message: 'Could not update expense.' });
  }
});

app.delete('/api/expenses/:id', auth, async (request, response) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: request.params.id,
      user: request.userId,
    });

    if (!expense) return response.status(404).json({ message: 'Expense not found.' });
    response.status(204).end();
  } catch (error) {
    const status = error.name === 'CastError' ? 400 : 500;
    response.status(status).json({ message: 'Could not delete expense.' });
  }
});

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from server/.env');
    }
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing from server/.env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();