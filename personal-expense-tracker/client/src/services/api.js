const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'The request failed.');
  }

  if (response.status === 204) return null;
  return response.json();
}

function saveSession(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
}

export async function register(name, email, password) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });

  return saveSession(data);
}

export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return saveSession(data);
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function getExpenses() {
  return request('/expenses');
}

export function addExpense(expense) {
  return request('/expenses', {
    method: 'POST',
    body: JSON.stringify(expense),
  });
}

export function updateExpense(id, expense) {
  return request(`/expenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(expense),
  });
}

export function deleteExpense(id) {
  return request(`/expenses/${id}`, {
    method: 'DELETE',
  });
}