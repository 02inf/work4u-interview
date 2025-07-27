# AI Meeting Digest Backend

A FastAPI-based backend service that processes meeting transcripts and generates AI-powered summaries using Google's Gemini API.

## Features

- 🤖 **AI-Powered Summarization**: Uses Google Gemini API to generate structured meeting summaries
- 📊 **PostgreSQL Database**: Persistent storage for transcripts and summaries
- 🔄 **Real-time Streaming**: Optional streaming responses for better UX
- 🔗 **Shareable Links**: Public URLs for sharing digest summaries
- 🚀 **FastAPI Framework**: Modern, fast, and well-documented API
- 🔒 **CORS Support**: Configured for frontend integration

## API Endpoints

### Core Endpoints

- `POST /api/v1/digests/` - Create a new digest from transcript
- `POST /api/v1/digests/stream` - Create digest with streaming response
- `GET /api/v1/digests/` - List all digests (paginated)
- `GET /api/v1/digests/{id}` - Get specific digest by ID
- `GET /api/v1/digests/share/{public_id}` - Get shared digest by public ID
- `DELETE /api/v1/digests/{id}` - Delete a digest
- `PATCH /api/v1/digests/{id}/visibility` - Update digest sharing settings

### Utility Endpoints

- `GET /` - API welcome message
- `GET /api/v1/health` - Health check
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)

## Project Structure

```
backend/
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection and session
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── services.py          # Business logic services
│   ├── ai_service.py        # Google Gemini integration
│   └── api/
│       ├── __init__.py      # API router setup
│       └── digests.py       # Digest endpoints
├── alembic/                 # Database migrations
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
├── alembic.ini            # Alembic configuration
├── setup_db.py           # Database setup script
└── run_server.py          # Development server script
```

## Quick Start

### 1. Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Google Gemini API key

### 2. Environment Setup

```bash
# Clone and navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
```

### 3. Configure Environment

Edit `.env` file with your settings:

```env
# Database
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/meeting_digest_db
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=meeting_digest_db

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# App Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
HOST=0.0.0.0
PORT=8000

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. Database Setup

```bash
# Make sure PostgreSQL is running
# Create database and run migrations
python setup_db.py
```

### 5. Start the Server

```bash
# Development server
python run_server.py

# Or using uvicorn directly
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- Main API: http://localhost:8000
- Documentation: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## Database Schema

### MeetingDigest Table

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| public_id | UUID | Public identifier for sharing |
| original_transcript | Text | Raw meeting transcript |
| summary_overview | Text | Brief meeting overview |
| key_decisions | Text | JSON array of key decisions |
| action_items | Text | JSON array of action items |
| full_summary | Text | Complete AI response |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |
| is_public | Boolean | Whether digest is shareable |

## API Usage Examples

### Create a Digest

```bash
curl -X POST "http://localhost:8000/api/v1/digests/" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Meeting started at 9 AM. John discussed the quarterly results. We decided to increase the marketing budget by 20%. Sarah will prepare the presentation by Friday."
  }'
```

### Get All Digests

```bash
curl "http://localhost:8000/api/v1/digests/"
```

### Get Shared Digest

```bash
curl "http://localhost:8000/api/v1/digests/share/{public_id}"
```

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Code Formatting

```bash
# Install formatting tools
pip install black isort

# Format code
black src/
isort src/
```

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | postgresql://... | Complete database URL |
| GEMINI_API_KEY | "" | Google Gemini API key |
| DEBUG | True | Enable debug mode |
| HOST | 0.0.0.0 | Server host |
| PORT | 8000 | Server port |
| ALLOWED_ORIGINS | localhost:3000,localhost:5173 | CORS allowed origins |

### Feature Flags

- **Streaming**: Enable/disable streaming responses
- **Public Sharing**: Control digest sharing functionality
- **Debug Mode**: Enhanced logging and error details

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Invalid input data
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server or AI service errors

All errors return JSON with descriptive messages:

```json
{
  "detail": "Error description",
  "error_code": "OPTIONAL_ERROR_CODE"
}
```

## Performance Considerations

- **Database Connection Pooling**: Configured for concurrent requests
- **AI API Rate Limiting**: Handles Gemini API limitations
- **Response Caching**: Future enhancement for repeated queries
- **Pagination**: List endpoints support skip/limit parameters

## Security

- **CORS Configuration**: Restricts frontend origins
- **Input Validation**: Pydantic schemas validate all inputs
- **SQL Injection Protection**: SQLAlchemy ORM prevents injection
- **API Key Security**: Environment-based configuration

## Deployment

### Docker (Optional)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ ./src/
COPY alembic/ ./alembic/
COPY alembic.ini .

EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Considerations

- Use a production WSGI server (Gunicorn + Uvicorn)
- Configure proper logging
- Set up health checks
- Use environment-specific configurations
- Enable database connection pooling
- Configure reverse proxy (Nginx)

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify connection credentials
   - Ensure database exists

2. **Gemini API Errors**
   - Verify API key is correct
   - Check quota/rate limits
   - Ensure internet connectivity

3. **Import Errors**
   - Verify virtual environment is activated
   - Check all dependencies are installed
   - Ensure Python path is correct

### Debugging

Enable debug mode for detailed error information:

```env
DEBUG=True
```

Check logs for detailed error traces and database queries.

## Contributing

1. Follow PEP 8 style guidelines
2. Add type hints to all functions
3. Write docstrings for public methods
4. Include tests for new features
5. Update this README for significant changes

## License

This project is part of the work4u interview assignment.
