import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://username:password@localhost:5432/meeting_digest_db"
    db_user: str = "username"
    db_password: str = "password"
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "meeting_digest_db"
    
    # Google Gemini API
    gemini_api_key: str = ""
    
    # App Settings
    secret_key: str = "your-secret-key-here"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS - String that will be split into a list
    allowed_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:5173"
    
    # Pydantic v2 configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert the comma-separated string to a list."""
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

settings = Settings()
