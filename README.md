# BilimDeck

Full-stack flashcard app with Django REST Framework backend and Next.js App Router frontend.

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

- **Django 5.2.x** - Web framework
- **Django REST Framework** - API framework
- **django-cors-headers** - CORS middleware
- **SimpleJWT** - JWT auth
- **uv** - Fast Python package manager

### Frontend

- **Next.js 16** - React framework with App Router
- **NextAuth** - Auth session handling
- **next-intl** - i18n
- **Tailwind CSS v4** - Utility-first CSS
- **shadcn/ui** - UI components
- **React 19** - UI library

## Getting Started

### Backend Setup

1. Navigate to the backend directory:

   ```powershell
   cd backend
   ```

2. Activate the virtual environment (optional):

   ```powershell
   (not needed with uv run)
   ```

3. Run migrations:

   ```powershell
   uv run python manage.py migrate
   ```

4. Start the Django development server:

   ```powershell
   uv run python manage.py runserver
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:

   ```powershell
   cd frontend
   ```

2. Install dependencies:

   ```powershell
   npm install
   ```

3. Start the Next.js development server:

   ```powershell
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## Environment Variables

### Backend (.env)

```
DEBUG=True
SECRET_KEY=changeme
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
AUTH_SECRET=changeme
```

## Auth Overview

- Frontend uses NextAuth Credentials Provider.
- Backend issues JWT access/refresh via `/api/token/`.
- Frontend stores tokens in NextAuth session and refreshes as needed.

## API Endpoints (Overview)

- `GET /api/ping/`
- `POST /api/token/`
- `POST /api/token/refresh/`
- `GET /api/auth/me/`
- `GET /api/dashboard/summary/`
- `GET /api/decks/` / `POST /api/decks/`
- `GET /api/decks/:id/`
- `GET /api/decks/:id/study/queue/`
- `POST /api/decks/:id/study/answer/`
- `POST /api/decks/:id/test/start/`
- `POST /api/decks/:id/test/answer/`
- `POST /api/decks/:id/test/finish/`
- `GET /api/decks/:id/participation/summary/`
- `POST /api/decks/:id/participation/join/`

## Testing

Run Django tests:

```powershell
cd backend
uv run python manage.py test
```

## Known Limitations / TODO

- TODO: Improve test grading (fuzzy match, multiple choice).
- TODO: Add study/test analytics dashboards.
- TODO: Add invite system for private decks.
- TODO: Add pagination for large participant lists.

## Useful Commands

### Backend

```powershell
# Make migrations
uv run python manage.py makemigrations

# Create superuser
uv run python manage.py createsuperuser
```

### Frontend

```powershell
# Build for production
npm run build

# Start production server
npm start
```

## Local Development (Updated)

### Backend (uv)

```powershell
cd backend
uv run python manage.py migrate
uv run python manage.py runserver
```

### Frontend (npm)

```powershell
cd frontend
npm install
npm run dev
```

### Database (Supabase Postgres)

Configure in `backend/.env`:

```env
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

`DATABASE_URL` is still accepted as fallback.

