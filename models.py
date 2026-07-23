from sqlalchemy import Column, Integer, String, Float, UniqueConstraint
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # Simple password for verification

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # 'income' or 'expense'
    category = Column(String, nullable=False)
    date = Column(String, nullable=False)  # YYYY-MM-DD
    notes = Column(String, nullable=True)
    payment_method = Column(String, nullable=False)  # 'Cash', 'Credit Card', 'Bank Transfer'
    user_email = Column(String, nullable=False, index=True)

class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    target_date = Column(String, nullable=False)  # YYYY-MM-DD
    user_email = Column(String, nullable=False, index=True)

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False, index=True)
    limit_amount = Column(Float, nullable=False)
    user_email = Column(String, nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint('category', 'user_email', name='uix_category_user_email'),
    )
