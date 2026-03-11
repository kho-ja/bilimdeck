# Backend run (uv, no manual venv)

Use `uv run` directly:

```powershell
cd backend
uv run python manage.py migrate
uv run python manage.py runserver
```

## Supabase database

Set one of these in `backend/.env`:

- `SUPABASE_DB_URL` (preferred)
- `DATABASE_URL` (fallback)
- `USE_SQLITE=True` to force the local `db.sqlite3` database during development

Example:

```env
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

On Windows, the direct `db.[PROJECT-REF].supabase.co` host may fail in Python if only an IPv6 record is available. In that case, either keep `USE_SQLITE=True` for local development or replace the URL with the Supabase pooler connection string from the dashboard, which is typically IPv4-friendly.
