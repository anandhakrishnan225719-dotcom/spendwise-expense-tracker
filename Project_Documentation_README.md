# Personal Expense Tracker

A MERN stack capstone application for recording personal expenses and reviewing monthly spending. It provides account registration and login, expense management, category summaries, and search/filter controls.

## Live application
- Frontend: https://spendwise-expense-tracker-1h76.onrender.com
- API health: https://spendwise-api-appu.onrender.com/api/health
- GitHub: https://github.com/anandhakrishnan225719-dotcom/spendwise-expense-tracker

## Features
- Register and log in with an email and password.
- Add, view, edit, and delete expenses.
- Categories: Food, Transport, Shopping, Bills, Health, Entertainment, Other.
- Review monthly spend, expense count, top category, and category summary.
- Search/filter transactions. Expense records are scoped to the signed-in account.

## Technology
- Client: React 19, Vite 8, JavaScript, CSS.
- Server: Node.js, Express 5, Mongoose 9.
- Database: MongoDB Atlas.
- Authentication: bcryptjs and JSON Web Tokens.
- Hosting: Render static site (client) and web service (API).

## Repository layout
```text
spendwise/
├── .gitignore
├── server/
│   ├── middleware/auth.js
│   ├── models/Expense.js and User.js
│   ├── routes/auth.js
│   ├── server.js
│   └── package.json
└── personal-expense-tracker/client/
    ├── src/App.jsx
    ├── src/services/api.js
    └── package.json
```

## Run locally
Prerequisites: Node.js/npm and MongoDB Atlas or local MongoDB. Open two VS Code terminals from the repository root.

### Configure and start the server
Create `server/.env` (never commit it):
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```
Then run:
```bash
cd server
npm install
npm run dev
```
The API should connect to MongoDB and listen on port 5000. Check `http://localhost:5000/api/health`.

### Start the client
Create `personal-expense-tracker/client/.env` if needed:
```env
VITE_API_URL=http://localhost:5000/api
```
In a second terminal run:
```bash
cd personal-expense-tracker/client
npm install
npm run dev
```
Open the local URL printed by Vite, usually `http://localhost:5173`.

## Environment variables
| Variable | Service | Purpose |
| --- | --- | --- |
| `PORT` | Server | API port; hosting platforms supply this value. |
| `MONGODB_URI` | Server | MongoDB connection string; keep secret. |
| `JWT_SECRET` | Server | Secret used to sign login tokens; use a long unique value. |
| `CLIENT_URL` | Server | Client origin allowed by CORS. |
| `VITE_API_URL` | Client | API base URL ending in `/api`. |

On Render, set backend variables in the API service Environment page and `VITE_API_URL` in the static site settings, then redeploy. Use the backend URL followed by `/api` as the client API base. Do not put a database secret in a frontend variable.

## API overview
| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | No | Health check. |
| POST | `/api/auth/register` | No | Create an account. |
| POST | `/api/auth/login` | No | Log in. |
| GET | `/api/expenses` | Bearer | List current user’s expenses. |
| POST | `/api/expenses` | Bearer | Add an expense. |
| PATCH | `/api/expenses/:id` | Bearer | Edit an owned expense. |
| DELETE | `/api/expenses/:id` | Bearer | Delete an owned expense. |

Expense request fields are `name`, `amount`, `category`, and `date`. The server validates the name (up to 60 characters), positive amount, supported category, and valid date. Protected endpoints only return or modify the signed-in user’s records.

## Data model
- **User:** name, normalized unique email, password hash, timestamps.
- **Expense:** name, amount, category, date, owner reference, timestamps.

Passwords are stored as bcrypt hashes. Never store or share a plaintext password.

## User guide
1. Open the live application and register, or log in.
2. Enter an expense name, amount, category, and date, then submit.
3. Review monthly totals and category summary.
4. Find a transaction using search/filter controls.
5. Use the transaction edit/delete actions to maintain records.
6. Log out when finished, especially on a shared device.

## Deployment and troubleshooting
The client and API are separate Render services; the API connects to MongoDB Atlas using server-side environment variables. CORS must allow the deployed client origin. After changing settings, redeploy and check service logs and `/api/health`. Free hosting may take time to wake. If the client shows a fetch error, confirm `VITE_API_URL` includes the backend URL and `/api`, the API is deployed, and CORS allows the client URL. If MongoDB fails, confirm `MONGODB_URI`, Atlas network access, and database user permissions.

## Privacy and security
- `.env` files and `node_modules` are excluded by `.gitignore`.
- Do not publish database connection strings, passwords, or JWT secrets in GitHub or screenshots.
- If any real credential has been exposed, rotate it with the provider and update hosting settings.
- The current client stores the login token in local storage. HttpOnly secure cookies and rate limiting are possible production improvements.

## Limitations and future work
No automated test suite, pagination, password reset, email verification, rate limiting, recurring expenses, budgets/alerts, receipt uploads, or CSV export are currently documented. Future improvements could add API/UI tests, export, pagination, and budget limits.

## Project report
See `Personal_Expense_Tracker_Project_Report.docx` and its PDF copy. Replace bracketed student, institution, course/batch, guide, and submission-date fields before submitting.
