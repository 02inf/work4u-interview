from sqlalchemy.orm import Session
from ..database import get_db

# Re-export database dependency for use in routers
get_database = get_db