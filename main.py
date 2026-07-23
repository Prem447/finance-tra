import csv
import io
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import inspect, create_engine
import os
from typing import Optional

from app import models, schemas, crud, database
from app.database import engine, get_db
from app.seed import seed_db

# Perform automatic database schema migrations if old version exists
db_file = "./finance.db"
if os.path.exists(db_file):
    try:
        test_engine = create_engine("sqlite:///./finance.db")
        inspector = inspect(test_engine)
        if "users" not in inspector.get_table_names():
            test_engine.dispose()
            print("Old database schema detected. Resetting database to apply migrations...")
            os.remove(db_file)
        else:
            test_engine.dispose()
    except Exception as e:
        print("Error checking database schema version:", e)

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Seed database on startup
db = database.SessionLocal()
try:
    seed_db(db)
finally:
    db.close()

app = FastAPI(title="Personal Finance & Expense Tracker API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Header Helper
def get_user_email(x_user_email: Optional[str] = Header(None)):
    if not x_user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in."
        )
    return x_user_email

# Auth Routes
@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email is already registered")
    return crud.create_user(db, user)

@app.post("/api/auth/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user or db_user.password != user.password:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    return {"message": "Login successful", "email": db_user.email}

# API Endpoints: Transactions
@app.get("/api/transactions", response_model=list[schemas.TransactionResponse])
def read_transactions(skip: int = 0, limit: int = 1000, user_email: str = Depends(get_user_email), db: Session = Depends(get_db)):
    return crud.get_transactions(db, user_email=user_email, skip=skip, limit=limit)

@app.post("/api/transactions", response_model=schemas.TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(transaction: schemas.TransactionCreate, user_email: str = Depends(get_user_email), db: Session = Depends(get_db)):
    return crud.create_transaction(db, transaction=transaction, user_email=user_email)

@app.put("/api/transactions/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(transaction_id: int, transaction: schemas.TransactionUpdate, user_email: str = Depends(get_user_email), db: Session = Depends(get_db)):
    db_tx = crud.update_transaction(db, transaction_id=transaction_id, transaction=transaction, user_email=user_email)
    if db_tx is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return db_tx

@app.delete("/api/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int, user_email: str = Depends(get_user_email), db: Session = Depends(get_db)):
    success = crud.delete_transaction(db, transaction_id=transaction_id, user_email=user_email)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return

@app.get("/api/transactions/export")
def export_transactions_csv(email: Optional[str] = None, x_user_email: Optional[str] = Header(None), db: Session = Depends(get_db)):
    # Support both header and query param for CSV download triggers
    user_email = email or x_user_email
    if not user_email:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_email == user_email
    ).order_by(models.Transaction.date.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Amount (INR)", "Type", "Category", "Date", "Payment Method", "Notes"])
    for t in transactions:
        writer.writerow([t.id, t.amount, t.type, t.category, t.date, t.payment_method, t.notes or ""])
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=transactions_{user_email}.csv"}
    )

# API Endpoints: Savings Goals
@app.get("/api/savings_goals", response_model=list[schemas.SavingsGoalResponse])
def read_savings_goals(skip: int = 0, limit: int = 100, user_email: str = Depends(get_user_email), db: Session = Depends(get_db)):
    return crud.get_savings_goals(db, user_email=user_email, skip=skip, limit=limit)

@app.post("/api/savings_goals", response_model=schemas.SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
def create_savings_goal(goal: schemas.SavingsGoalCreate, user_email: str = Depends(get_user_email), db: Session = Depends(get_db)):
    return crud.create_savings_goal(db, goal=goal, user_email=user_email)

@app.put("/api/savings_goals/{goal_id}", response_model=schemas.SavingsGoalResponse)
def update_savings_goal(goal_id: int, goal: schemas.SavingsGoalUpdate, user_email: str = Depends(get_user_email), db: Session = Depends(get_db)):
    db_goal = crud.update_savings_goal(db, goal_id=goal_id, goal=goal, user_email=user_email)
    if db_goal is None:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    return db_goal

@app.delete("/api/savings_goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_savings_goal(goal_id: int, user_email: str = Depends(get_user_email), db: Session = Depends(get_db)):
    success = crud.delete_savings_goal(db, goal_id=goal_id, user_email=user_email)
    if not success:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    return

# API Endpoints: Budgets
@app.get("/api/budgets", response_model=list[schemas.BudgetResponse])
def read_budgets(skip: int = 0, limit: int = 100, user_email: str = Depends(get_user_email), db: Session = Depends(get_db)):
    return crud.get_budgets(db, user_email=user_email, skip=skip, limit=limit)

@app.post("/api/budgets", response_model=schemas.BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(budget: schemas.BudgetCreate, user_email: str = Depends(get_user_email), db: Session = Depends(get_db)):
    existing = crud.get_budget_by_category(db, category=budget.category, user_email=user_email)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Budget limit for category '{budget.category}' already exists."
        )
    return crud.create_budget(db, budget=budget, user_email=user_email)

@app.put("/api/budgets/{budget_id}", response_model=schemas.BudgetResponse)
def update_budget(budget_id: int, budget: schemas.BudgetUpdate, user_email: str = Depends(get_user_email), db: Session = Depends(get_db)):
    db_budget = crud.update_budget(db, budget_id=budget_id, budget=budget, user_email=user_email)
    if db_budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    return db_budget

@app.delete("/api/budgets/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(budget_id: int, user_email: str = Depends(get_user_email), db: Session = Depends(get_db)):
    success = crud.delete_budget(db, budget_id=budget_id, user_email=user_email)
    if not success:
        raise HTTPException(status_code=404, detail="Budget not found")
    return

# API Endpoints: Dashboard Analytics
@app.get("/api/dashboard/summary")
def get_dashboard_summary(user_email: str = Depends(get_user_email), db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).filter(models.Transaction.user_email == user_email).all()
    goals = db.query(models.SavingsGoal).filter(models.SavingsGoal.user_email == user_email).all()
    budgets = db.query(models.Budget).filter(models.Budget.user_email == user_email).all()
    
    total_income = sum(t.amount for t in transactions if t.type == 'income')
    total_expense = sum(t.amount for t in transactions if t.type == 'expense')
    net_balance = total_income - total_expense
    
    active_goals_count = len(goals)
    
    category_spending = {}
    for t in transactions:
        if t.type == 'expense':
            category_spending[t.category] = category_spending.get(t.category, 0.0) + t.amount
            
    monthly_trend = {}
    for t in transactions:
        month = t.date[:7] if t.date and len(t.date) >= 7 else "Unknown"
        if month not in monthly_trend:
            monthly_trend[month] = {"income": 0.0, "expense": 0.0}
        if t.type == 'income':
            monthly_trend[month]["income"] += t.amount
        elif t.type == 'expense':
            monthly_trend[month]["expense"] += t.amount
            
    sorted_months = sorted(list(monthly_trend.keys()))
    monthly_trend_sorted = {m: monthly_trend[m] for m in sorted_months}
    
    return {
        "summary": {
            "total_income": total_income,
            "total_expense": total_expense,
            "net_balance": net_balance,
            "active_goals_count": active_goals_count
        },
        "category_spending": category_spending,
        "monthly_trend": monthly_trend_sorted,
        "budgets": [{ "category": b.category, "limit_amount": b.limit_amount } for b in budgets]
    }

# Serve static frontend files
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def read_root():
    static_index = os.path.join(static_dir, "index.html")
    if os.path.exists(static_index):
        return FileResponse(static_index)
    return {"message": "Welcome to Personal Finance API. Frontend static files not found yet."}
