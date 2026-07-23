from sqlalchemy.orm import Session
from app import models, schemas

# Users CRUD
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(email=user.email, password=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Transactions CRUD
def get_transaction(db: Session, transaction_id: int, user_email: str):
    return db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_email == user_email
    ).first()

def get_transactions(db: Session, user_email: str, skip: int = 0, limit: int = 1000):
    return db.query(models.Transaction).filter(
        models.Transaction.user_email == user_email
    ).order_by(models.Transaction.date.desc()).offset(skip).limit(limit).all()

def create_transaction(db: Session, transaction: schemas.TransactionCreate, user_email: str):
    db_tx = models.Transaction(**transaction.dict(), user_email=user_email)
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx

def update_transaction(db: Session, transaction_id: int, transaction: schemas.TransactionUpdate, user_email: str):
    db_tx = get_transaction(db, transaction_id, user_email)
    if not db_tx:
        return None
    for key, value in transaction.dict(exclude_unset=True).items():
        setattr(db_tx, key, value)
    db.commit()
    db.refresh(db_tx)
    return db_tx

def delete_transaction(db: Session, transaction_id: int, user_email: str):
    db_tx = get_transaction(db, transaction_id, user_email)
    if not db_tx:
        return False
    db.delete(db_tx)
    db.commit()
    return True

# Savings Goals CRUD
def get_savings_goal(db: Session, goal_id: int, user_email: str):
    return db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id == goal_id,
        models.SavingsGoal.user_email == user_email
    ).first()

def get_savings_goals(db: Session, user_email: str, skip: int = 0, limit: int = 100):
    return db.query(models.SavingsGoal).filter(
        models.SavingsGoal.user_email == user_email
    ).offset(skip).limit(limit).all()

def create_savings_goal(db: Session, goal: schemas.SavingsGoalCreate, user_email: str):
    db_goal = models.SavingsGoal(**goal.dict(), user_email=user_email)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

def update_savings_goal(db: Session, goal_id: int, goal: schemas.SavingsGoalUpdate, user_email: str):
    db_goal = get_savings_goal(db, goal_id, user_email)
    if not db_goal:
        return None
    for key, value in goal.dict(exclude_unset=True).items():
        setattr(db_goal, key, value)
    db.commit()
    db.refresh(db_goal)
    return db_goal

def delete_savings_goal(db: Session, goal_id: int, user_email: str):
    db_goal = get_savings_goal(db, goal_id, user_email)
    if not db_goal:
        return False
    db.delete(db_goal)
    db.commit()
    return True

# Budgets CRUD
def get_budget(db: Session, budget_id: int, user_email: str):
    return db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_email == user_email
    ).first()

def get_budget_by_category(db: Session, category: str, user_email: str):
    return db.query(models.Budget).filter(
        models.Budget.category == category,
        models.Budget.user_email == user_email
    ).first()

def get_budgets(db: Session, user_email: str, skip: int = 0, limit: int = 100):
    return db.query(models.Budget).filter(
        models.Budget.user_email == user_email
    ).offset(skip).limit(limit).all()

def create_budget(db: Session, budget: schemas.BudgetCreate, user_email: str):
    db_budget = models.Budget(**budget.dict(), user_email=user_email)
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

def update_budget(db: Session, budget_id: int, budget: schemas.BudgetUpdate, user_email: str):
    db_budget = get_budget(db, budget_id, user_email)
    if not db_budget:
        return None
    for key, value in budget.dict(exclude_unset=True).items():
        setattr(db_budget, key, value)
    db.commit()
    db.refresh(db_budget)
    return db_budget

def delete_budget(db: Session, budget_id: int, user_email: str):
    db_budget = get_budget(db, budget_id, user_email)
    if not db_budget:
        return False
    db.delete(db_budget)
    db.commit()
    return True
