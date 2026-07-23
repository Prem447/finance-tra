# FinFlow | Personal Finance & Expense Tracker

A production-ready, responsive, full-stack Personal Finance & Expense Tracker web application. FinFlow helps users visualize and track incomes, expenses, savings targets, and monthly category budget ceilings, complete with automatic notifications and data export functionality.

## 🚀 Key Features

1. **Interactive Dashboard**: Summary metrics for Income, Expenses, Balance, and Active Savings Goals alongside custom analytics charts (Category breakdown donut chart & Monthly trend bar chart).
2. **Comprehensive Transactions Ledger**: Track date, category, amount, payment method, type, and custom notes. Support for real-time multi-column sorting, search, and category/type filtering.
3. **Savings & Funding Goals Tracker**: Interactive targets displaying progress bars and deadlines. Supports quick-updates for checking saving milestones.
4. **Active Budget limits**: Set category-specific expenditure caps. Displays responsive progress bars changing colors (Green -> Yellow -> Red) when nearing or exceeding limits.
5. **Robust Local Storage**: Backed by a SQLite relational database using SQLAlchemy ORM (zero-config, local persistence).
6. **Data Export**: One-click download of all transaction details in CSV format.
7. **Mock Seeding**: Pre-loaded mock transactions, budgets, and savings goals on first startup to present a populated visual layout instantly.

---

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy
- **Database**: SQLite (local database file `finance.db` generated on startup)
- **Frontend**: HTML5, CSS3, Tailwind CSS (via CDN), Chart.js (via CDN), Lucide Icons (via CDN), Vanilla JavaScript

---

## 📂 Project Structure

```text
personal-finance-tracker/
├── app/
│   ├── __init__.py
│   ├── database.py   # SQLAlchemy setup & session helper
│   ├── models.py     # SQLite database schemas
│   ├── schemas.py    # Pydantic validation schemas
│   ├── crud.py       # DB action query logic (CRUD)
│   ├── seed.py       # Initial mock data loader
│   └── main.py       # FastAPI application & API endpoints
├── static/
│   ├── index.html    # SPA templates & modals UI
│   ├── app.js        # SPA state controllers & event callbacks
│   └── styles.css    # Custom glassmorphic transitions & animations
├── requirements.txt  # Python server packages
├── README.md         # Project documentation
└── run.py            # Automated runner script
```

---

## ⚙️ How to Run

### Automated Execution (Recommended)
Simply run the main launcher script. It checks/installs dependencies automatically and hosts the web app:

```bash
python run.py
```
After launch, the script will automatically open your default browser to `http://127.0.0.1:8000`.

### Manual Step-by-Step Execution
1. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the FastAPI server using Uvicorn:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
3. Open your browser and navigate to `http://127.0.0.1:8000`.

---

## 🛑 How to Stop
To shut down the application:
1. Press `Ctrl + C` in the command prompt or terminal window running the server.
