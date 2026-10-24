import { useEffect, useState } from 'react';
import {
  getExpenses,
  addExpense as createExpense,
  updateExpense,
  deleteExpense as removeExpense,
  register,
  login,
  logout,
  getCurrentUser,
} from './services/api';
import './App.css';

const categories = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Other',
];

function todayAsInputValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function formatMoney(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [editingId, setEditingId] = useState(null);

  const [user, setUser] = useState(() => getCurrentUser());
  const [authMode, setAuthMode] = useState('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authSaving, setAuthSaving] = useState(false);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [date, setDate] = useState(todayAsInputValue());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    let active = true;

    if (!user) {
      setExpenses([]);
      setLoading(false);

      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError('');

    getExpenses()
      .then((data) => {
        if (active) setExpenses(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey, user]);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthExpenses = expenses.filter((expense) =>
    String(expense.date).startsWith(currentMonth)
  );

  const monthTotal = monthExpenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  const categoryTotals = categories
    .map((item) => ({
      name: item,
      total: monthExpenses
        .filter((expense) => expense.category === item)
        .reduce((sum, expense) => sum + Number(expense.amount), 0),
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const visibleExpenses = [...expenses]
    .filter((expense) => filter === 'All' || expense.category === filter)
    .filter((expense) =>
      expense.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setError('');
    setAuthSaving(true);

    try {
      const result =
        authMode === 'register'
          ? await register(authName, authEmail, authPassword)
          : await login(authEmail, authPassword);

      setUser(result.user);
      setAuthPassword('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAuthSaving(false);
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
    setExpenses([]);
    setError('');
    setAuthPassword('');
  }

  async function handleSaveExpense(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const expenseData = {
      name: name.trim(),
      amount: Number(amount),
      category,
      date,
    };

    try {
      if (editingId) {
        const updatedExpense = await updateExpense(editingId, expenseData);
        setExpenses((current) =>
          current.map((expense) =>
            expense._id === editingId ? updatedExpense : expense
          )
        );
      } else {
        const savedExpense = await createExpense(expenseData);
        setExpenses((current) => [savedExpense, ...current]);
      }

      setName('');
      setAmount('');
      setCategory(categories[0]);
      setDate(todayAsInputValue());
      setEditingId(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEditExpense(expense) {
    setEditingId(expense._id);
    setName(expense.name);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setDate(String(expense.date).slice(0, 10));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setName('');
    setAmount('');
    setCategory(categories[0]);
    setDate(todayAsInputValue());
  }

  async function handleDeleteExpense(id) {
    setError('');

    try {
      await removeExpense(id);
      setExpenses((current) =>
        current.filter((expense) => expense._id !== id)
      );

      if (editingId === id) {
        cancelEdit();
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (!user) {
    return (
      <main className="page">
        <header className="header">
          <a className="brand" href="/">Pennywise</a>
          <span className="header-note">Your personal expense tracker</span>
        </header>

        <section
          className="panel"
          style={{ maxWidth: '520px', margin: '48px auto' }}
        >
          <h1>{authMode === 'register' ? 'Create an account' : 'Welcome back'}</h1>

          <p className="panel-description">
            {authMode === 'register'
              ? 'Register to start tracking your expenses.'
              : 'Log in to view and manage your expenses.'}
          </p>

          {error && (
            <p role="alert" style={{ color: '#a14d42' }}>
              {error}
            </p>
          )}

          <form className="expense-form" onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <label>
                Name
                <input
                  value={authName}
                  onChange={(event) => setAuthName(event.target.value)}
                  required
                  maxLength="60"
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                required
                minLength="6"
              />
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={authSaving}
            >
              {authSaving
                ? 'Please wait…'
                : authMode === 'register'
                  ? 'Create account'
                  : 'Log in'}
            </button>
          </form>

          <p>
            {authMode === 'register' ? 'Already registered?' : 'New here?'}{' '}
            <button
              type="button"
              className="edit-button"
              onClick={() => {
                setError('');
                setAuthMode(authMode === 'register' ? 'login' : 'register');
              }}
            >
              {authMode === 'register' ? 'Log in' : 'Create an account'}
            </button>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="header">
        <a className="brand" href="/">Pennywise</a>
        <span className="header-note">Your personal expense tracker</span>
        <span className="header-note">Signed in as {user.name}</span>
        <button
          type="button"
          className="delete-button"
          onClick={handleLogout}
        >
          Log out
        </button>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">YOUR MONEY, MADE CLEAR</p>
          <h1>Expense overview</h1>
          <p className="subheading">
            Keep track of what you spend, one entry at a time.
          </p>
        </div>
      </section>

      {error && (
        <p role="alert" style={{ color: '#a14d42' }}>
          {error}{' '}
          <button
            type="button"
            className="delete-button"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Retry
          </button>
        </p>
      )}

      <section className="summary-grid" aria-label="Monthly summary">
        <article className="summary-card">
          <p>Spent this month</p>
          <strong>{formatMoney(monthTotal)}</strong>
        </article>

        <article className="summary-card">
          <p>Expenses this month</p>
          <strong>{monthExpenses.length}</strong>
        </article>

        <article className="summary-card">
          <p>Top category</p>
          <strong>{categoryTotals[0]?.name ?? 'No expenses yet'}</strong>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <h2>{editingId ? 'Edit expense' : 'Add an expense'}</h2>
          <p className="panel-description">
            {editingId
              ? 'Change the details, then save your update.'
              : 'Enter the details below to record a purchase.'}
          </p>

          <form className="expense-form" onSubmit={handleSaveExpense}>
            <label>
              Expense name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="For example, lunch"
                maxLength="60"
                required
              />
            </label>

            <div className="form-row">
              <label>
                Amount (₹)
                <input
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  min="1"
                  step="1"
                  placeholder="500"
                  required
                />
              </label>

              <label>
                Category
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Date
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={saving}>
              {saving
                ? 'Saving…'
                : editingId
                  ? 'Save changes'
                  : 'Add expense'}
            </button>

            {editingId && (
              <button
                type="button"
                className="edit-button"
                onClick={cancelEdit}
              >
                Cancel edit
              </button>
            )}
          </form>
        </article>

        <article className="panel">
          <h2>Spending by category</h2>
          <p className="panel-description">
            A monthly summary of your recorded expenses.
          </p>

          {categoryTotals.length === 0 ? (
            <p className="empty-message">
              Add an expense to see your category summary.
            </p>
          ) : (
            <div className="category-list">
              {categoryTotals.map((item) => (
                <div className="category-row" key={item.name}>
                  <div>
                    <span>{item.name}</span>
                    <strong>{formatMoney(item.total)}</strong>
                  </div>

                  <div className="bar-track">
                    <span
                      style={{ width: `${(item.total / monthTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="panel transactions">
        <div className="transactions-heading">
          <div>
            <h2>Transactions</h2>
            <p className="panel-description">
              Search, filter, and review your expenses.
            </p>
          </div>

          <div className="list-controls">
            <input
              aria-label="Search expenses"
              placeholder="Search by name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              aria-label="Filter by category"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option>All</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="empty-message">Loading expenses…</p>
        ) : visibleExpenses.length === 0 ? (
          <p className="empty-message">
            No matching expenses. Add an expense to get started.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Expense</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleExpenses.map((expense) => (
                  <tr key={expense._id}>
                    <td>{expense.name}</td>
                    <td>{expense.category}</td>
                    <td>{formatDate(expense.date)}</td>
                    <td>{formatMoney(expense.amount)}</td>
                    <td>
                      <button
                        type="button"
                        className="edit-button"
                        onClick={() => handleEditExpense(expense)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleDeleteExpense(expense._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer>Personal Expense Tracker · MERN stack capstone</footer>
    </main>
  );
}