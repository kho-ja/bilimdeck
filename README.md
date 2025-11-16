# BilimDeck

[![CI](https://github.com/kho-ja/bilimdeck/actions/workflows/ci.yml/badge.svg)](https://github.com/kho-ja/bilimdeck/actions/workflows/ci.yml)
[![CodeQL](https://github.com/kho-ja/bilimdeck/actions/workflows/codeql.yml/badge.svg)](https://github.com/kho-ja/bilimdeck/actions/workflows/codeql.yml)

A full-stack web application with Django REST Framework backend and Next.js + shadcn/ui frontend.

## Project Structure

```
BilimDeck/
├── backend/          # Django REST API
│   ├── api/          # API app with endpoints
│   ├── core/         # Django project settings
│   ├── manage.py
│   └── .venv/        # Python virtual environment (uv)
├── frontend/         # Next.js application
│   ├── src/
│   │   ├── app/      # App Router pages
│   │   ├── components/
│   │   └── lib/
│   └── package.json
└── README.md
```

## Tech Stack

### Backend

- **Django 5.2.8** - Web framework
- **Django REST Framework** - API framework
- **django-cors-headers** - CORS middleware
- **uv** - Fast Python package manager

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v4** - Utility-first CSS
- **shadcn/ui** - Beautiful UI components
- **React 19** - UI library

## Getting Started

### Backend Setup

1. Navigate to the backend directory:

   ```powershell
   cd backend
   ```

2. The virtual environment is already created with uv. To activate it manually (optional):

   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

3. Run migrations:

   ```powershell
   uv run -p .venv python manage.py migrate
   ```

4. Start the Django development server:

   ```powershell
   uv run -p .venv python manage.py runserver
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:

   ```powershell
   cd frontend
   ```

2. Install dependencies (if needed):

   ```powershell
   npm install
   ```

3. Start the Next.js development server:

   ```powershell
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## API Endpoints

- `GET /api/ping/` - Health check endpoint that returns `{"status": "ok"}`

## Testing

### Backend Tests

Run Django tests:

```powershell
cd backend
uv run -p .venv python manage.py test
```

## Features

✅ Django REST API with CORS configured  
✅ Next.js with TypeScript and App Router  
✅ Tailwind CSS v4 styling  
✅ shadcn/ui component library  
✅ Full-stack integration demo (ping endpoint)  
✅ Comprehensive CI/CD pipeline with GitHub Actions

## CI/CD Pipeline

This project includes a comprehensive CI/CD setup with the following workflows:

### 🔄 Continuous Integration (CI)
- **Automated Testing**: Runs on every push and pull request
- **Backend Tests**: Python 3.11 & 3.12 matrix testing
- **Frontend Tests**: Node.js 20.x & 22.x matrix testing
- **Code Quality**: Linting with flake8, black, isort (backend) and ESLint (frontend)
- **Type Checking**: TypeScript type validation
- **Build Verification**: Ensures the application builds successfully
- **Integration Tests**: API endpoint health checks

### 🔒 Security Scanning
- **CodeQL Analysis**: Advanced semantic code analysis for Python and JavaScript/TypeScript
- **Dependency Review**: Automated security checks for new dependencies in PRs
- **Weekly Vulnerability Scans**: Scheduled dependency security audits
- **Security Best Practices**: Bandit for Python and npm audit for JavaScript

### 🏷️ Automation
- **PR Labeler**: Automatically labels PRs based on changed files (backend/frontend/dependencies/ci-cd)
- **Dependency Updates**: Weekly automated dependency update reports

### 🚀 Deployment (Template)
- **Multi-Environment Support**: Staging and production deployment workflows
- **Health Checks**: Post-deployment validation
- **Manual & Automated Triggers**: Deploy on release or manually

### Running CI Locally

#### Backend
```bash
cd backend

# Install dev dependencies
pip install black isort flake8 bandit safety

# Format code
black .
isort .

# Lint
flake8 .

# Run tests
python manage.py test

# Security scan
bandit -r . -ll
safety check
```

#### Frontend
```bash
cd frontend

# Lint
npm run lint

# Type check
npx tsc --noEmit

# Build
npm run build

# Security audit
npm audit
```

## Development Notes

- **CORS**: Configured to allow `http://localhost:3000` and `http://127.0.0.1:3000`
- **CSRF**: Trusted origins configured for local development
- **Hot Reload**: Both servers support hot reloading during development

## Next Steps

1. Add authentication (JWT or session-based)
2. Create memory card models and CRUD endpoints
3. Build card UI components with shadcn/ui
4. Add database migrations for card data
5. Implement card flip animations
6. Add user management

## Useful Commands

### Backend

```powershell
# Create new Django app
uv run -p .venv python manage.py startapp <app_name>

# Make migrations
uv run -p .venv python manage.py makemigrations

# Create superuser
uv run -p .venv python manage.py createsuperuser
```

### Frontend

```powershell
# Add shadcn components
npx shadcn@latest add <component>

# Build for production
npm run build

# Start production server
npm start
```
