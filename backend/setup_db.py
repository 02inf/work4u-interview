#!/usr/bin/env python3
"""
Database setup script for the AI Meeting Digest backend.
This script creates the database and runs migrations.
"""

import os
import sys
import subprocess
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent / "src"))

from src.config import settings
from src.database import engine
from sqlalchemy import create_engine, text
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    """Create the PostgreSQL database if it doesn't exist."""
    try:
        # Connect to PostgreSQL server (without specifying database)
        conn = psycopg2.connect(
            host=settings.db_host,
            port=settings.db_port,
            user=settings.db_user,
            password=settings.db_password
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{settings.db_name}'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute(f"CREATE DATABASE {settings.db_name}")
            print(f"✅ Database '{settings.db_name}' created successfully!")
        else:
            print(f"✅ Database '{settings.db_name}' already exists!")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False
    
    return True

def run_migrations():
    """Run Alembic migrations."""
    try:
        # Run migrations
        result = subprocess.run(["alembic", "upgrade", "head"], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Database migrations completed successfully!")
            return True
        else:
            print(f"❌ Migration failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error running migrations: {e}")
        return False

def test_connection():
    """Test database connection."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ Database connection successful!")
            print(f"📊 PostgreSQL version: {version}")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def main():
    print("🚀 Setting up AI Meeting Digest Database...")
    print(f"📍 Database: {settings.db_name}")
    print(f"🏠 Host: {settings.db_host}:{settings.db_port}")
    print(f"👤 User: {settings.db_user}")
    print("-" * 50)
    
    # Step 1: Create database
    if not create_database():
        sys.exit(1)
    
    # Step 2: Test connection
    if not test_connection():
        sys.exit(1)
    
    # Step 3: Run migrations
    if not run_migrations():
        sys.exit(1)
    
    print("-" * 50)
    print("🎉 Database setup completed successfully!")
    print("🚀 You can now start the FastAPI server with: uvicorn src.main:app --reload")

if __name__ == "__main__":
    main()
