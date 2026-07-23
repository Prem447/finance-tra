from pydantic import BaseModel, Field, EmailStr
from typing import Optional

# User Schemas
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# Transaction Schemas
class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0)
    type: str  # 'income' or 'expense'
    category: str
    date: str  # YYYY-MM-DD
    notes: Optional[str] = None
    payment_method: str

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    notes: Optional[str] = None
    payment_method: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: int
    user_email: str

    class Config:
        from_attributes = True

# Savings Goal Schemas
class SavingsGoalBase(BaseModel):
    name: str
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(0.0, ge=0)
    target_date: str

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = Field(None, gt=0)
    current_amount: Optional[float] = Field(None, ge=0)
    target_date: Optional[str] = None

class SavingsGoalResponse(SavingsGoalBase):
    id: int
    user_email: str

    class Config:
        from_attributes = True

# Budget Schemas
class BudgetBase(BaseModel):
    category: str
    limit_amount: float = Field(..., gt=0)

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    limit_amount: Optional[float] = Field(None, gt=0)

class BudgetResponse(BudgetBase):
    id: int
    user_email: str

    class Config:
        from_attributes = True
