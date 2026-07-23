from sqlalchemy.orm import Session
from app import models, database

def seed_db(db: Session):
    # Check if we already have transactions
    if db.query(models.Transaction).first() is not None:
        print("Database already seeded.")
        return

    print("Seeding database...")

    # Seed Default User
    default_user = models.User(email="user@example.com", password="password123")
    db.add(default_user)
    db.commit() # Commit to generate ID first
    
    user_email = "user@example.com"

    # Seed Budgets
    budgets = [
        models.Budget(category="Food", limit_amount=5000.0, user_email=user_email),
        models.Budget(category="Rent", limit_amount=15000.0, user_email=user_email),
        models.Budget(category="Utilities", limit_amount=3000.0, user_email=user_email),
        models.Budget(category="Entertainment", limit_amount=4000.0, user_email=user_email),
        models.Budget(category="Shopping", limit_amount=3500.0, user_email=user_email),
    ]
    for b in budgets:
        db.add(b)

    # Seed Savings Goals
    goals = [
        models.SavingsGoal(name="Emergency Fund", target_amount=100000.0, current_amount=45000.0, target_date="2026-12-31", user_email=user_email),
        models.SavingsGoal(name="New Laptop", target_amount=85000.0, current_amount=42000.0, target_date="2026-09-30", user_email=user_email),
        models.SavingsGoal(name="Europe Trip", target_amount=350000.0, current_amount=150000.0, target_date="2027-06-30", user_email=user_email),
    ]
    for g in goals:
        db.add(g)

    # Seed Transactions (updated seed amounts to correspond better to Rupee metrics)
    transactions = [
        # Income
        models.Transaction(amount=85000.0, type="income", category="Salary", date="2026-05-01", notes="Monthly paycheck", payment_method="Bank Transfer", user_email=user_email),
        models.Transaction(amount=12000.0, type="income", category="Side Hustle", date="2026-05-15", notes="Freelance logo design", payment_method="Bank Transfer", user_email=user_email),
        models.Transaction(amount=85000.0, type="income", category="Salary", date="2026-06-01", notes="Monthly paycheck", payment_method="Bank Transfer", user_email=user_email),
        models.Transaction(amount=8500.0, type="income", category="Investments", date="2026-06-20", notes="Stock dividends", payment_method="Bank Transfer", user_email=user_email),
        models.Transaction(amount=85000.0, type="income", category="Salary", date="2026-07-01", notes="Monthly paycheck", payment_method="Bank Transfer", user_email=user_email),
        models.Transaction(amount=5000.0, type="income", category="Side Hustle", date="2026-07-10", notes="Web development advice", payment_method="Bank Transfer", user_email=user_email),

        # Expenses May 2026
        models.Transaction(amount=12000.0, type="expense", category="Rent", date="2026-05-02", notes="May Rent payment", payment_method="Bank Transfer", user_email=user_email),
        models.Transaction(amount=1800.0, type="expense", category="Utilities", date="2026-05-05", notes="Electricity & Water", payment_method="Credit Card", user_email=user_email),
        models.Transaction(amount=2500.0, type="expense", category="Food", date="2026-05-08", notes="Groceries stock up", payment_method="Credit Card", user_email=user_email),
        models.Transaction(amount=4500.0, type="expense", category="Entertainment", date="2026-05-12", notes="Concert ticket", payment_method="Credit Card", user_email=user_email),
        models.Transaction(amount=3200.0, type="expense", category="Shopping", date="2026-05-18", notes="Summer clothes", payment_method="Credit Card", user_email=user_email),
        models.Transaction(amount=1200.0, type="expense", category="Food", date="2026-05-25", notes="Dinner with friends", payment_method="Cash", user_email=user_email),

        # Expenses June 2026
        models.Transaction(amount=12000.0, type="expense", category="Rent", date="2026-06-02", notes="June Rent payment", payment_method="Bank Transfer", user_email=user_email),
        models.Transaction(amount=2200.0, type="expense", category="Utilities", date="2026-06-06", notes="Electricity, Water & Internet", payment_method="Credit Card", user_email=user_email),
        models.Transaction(amount=3500.0, type="expense", category="Food", date="2026-06-10", notes="Weekly grocery stock up", payment_method="Credit Card", user_email=user_email),
        models.Transaction(amount=2500.0, type="expense", category="Entertainment", date="2026-06-15", notes="Theme park entry", payment_method="Cash", user_email=user_email),
        models.Transaction(amount=4800.0, type="expense", category="Shopping", date="2026-06-22", notes="New desk chair", payment_method="Credit Card", user_email=user_email),

        # Expenses July 2026
        models.Transaction(amount=12000.0, type="expense", category="Rent", date="2026-07-02", notes="July Rent payment", payment_method="Bank Transfer", user_email=user_email),
        models.Transaction(amount=2400.0, type="expense", category="Utilities", date="2026-07-05", notes="Electricity & AC", payment_method="Credit Card", user_email=user_email),
        models.Transaction(amount=2100.0, type="expense", category="Food", date="2026-07-08", notes="Groceries and snacks", payment_method="Credit Card", user_email=user_email),
        models.Transaction(amount=1850.0, type="expense", category="Food", date="2026-07-12", notes="Sushi restaurant", payment_method="Credit Card", user_email=user_email),
        models.Transaction(amount=1550.0, type="expense", category="Entertainment", date="2026-07-15", notes="Movie night and snacks", payment_method="Cash", user_email=user_email),
        models.Transaction(amount=4200.0, type="expense", category="Shopping", date="2026-07-18", notes="Running shoes", payment_method="Credit Card", user_email=user_email),
    ]
    for t in transactions:
        db.add(t)

    db.commit()
    print("Database seeding completed.")

if __name__ == "__main__":
    db = database.SessionLocal()
    seed_db(db)
    db.close()
