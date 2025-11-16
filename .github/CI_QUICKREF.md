# CI/CD Quick Reference

This is a quick reference guide for developers working with the BilimDeck CI/CD pipeline.

## 🚦 CI Status Checks

Every PR must pass these checks:

| Check | What it does | How to fix locally |
|-------|--------------|-------------------|
| **Backend: Black** | Code formatting | `cd backend && black .` |
| **Backend: isort** | Import sorting | `cd backend && isort .` |
| **Backend: flake8** | Code linting | `cd backend && flake8 .` |
| **Backend: Tests** | Django unit tests | `cd backend && python manage.py test` |
| **Frontend: ESLint** | Code linting | `cd frontend && npm run lint` |
| **Frontend: TypeScript** | Type checking | `cd frontend && npx tsc --noEmit` |
| **Frontend: Build** | Production build | `cd frontend && npm run build` |
| **Integration** | API health check | Manual testing needed |

## 🔧 Local Setup

### One-time Setup

```bash
# Install pre-commit (optional but recommended)
pip install pre-commit
pre-commit install

# Backend dev dependencies
cd backend
pip install black isort flake8 bandit safety

# Frontend dependencies
cd frontend
npm ci
```

### Before Every Commit

#### Backend Changes
```bash
cd backend
black .           # Format code
isort .           # Sort imports
flake8 .          # Check for issues
python manage.py test  # Run tests
```

#### Frontend Changes
```bash
cd frontend
npm run lint      # Lint code
npx tsc --noEmit  # Type check
npm run build     # Test build
```

## 📝 Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches
- `hotfix/*` - Emergency fixes for production

## 🔄 Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit
3. Run local checks (see above)
4. Push to GitHub: `git push origin feature/my-feature`
5. Open Pull Request
6. Wait for CI to pass (usually 3-5 minutes)
7. Address any failures
8. Get code review
9. Merge!

## ⚡ Quick Fixes

### "Black check failed"
```bash
cd backend && black .
git add . && git commit -m "Format code with black"
```

### "isort check failed"
```bash
cd backend && isort .
git add . && git commit -m "Sort imports"
```

### "ESLint failed"
```bash
cd frontend && npm run lint -- --fix
git add . && git commit -m "Fix ESLint issues"
```

### "TypeScript errors"
Fix the type errors in your code, then:
```bash
cd frontend && npx tsc --noEmit  # Verify fixes
```

### "Tests failed"
```bash
cd backend && python manage.py test  # See which tests failed
# Fix the tests or code
git add . && git commit -m "Fix tests"
```

## 🏷️ PR Labels

PRs are auto-labeled based on files changed:
- `backend` - Changes in `backend/`
- `frontend` - Changes in `frontend/`
- `dependencies` - Package file changes
- `documentation` - Markdown file changes
- `ci/cd` - GitHub Actions changes

## 🔒 Security

### Running Security Scans Locally

#### Backend
```bash
cd backend
pip install bandit safety
bandit -r . -ll          # Code security scan
safety check             # Dependency vulnerabilities
```

#### Frontend
```bash
cd frontend
npm audit                # Dependency vulnerabilities
npm audit fix            # Auto-fix if possible
```

## 🚀 Deployment

The repository includes a deployment workflow template (`.github/workflows/deploy.yml`) that needs to be configured with your deployment target.

### Supported Deployment Options

**Backend:**
- Heroku
- AWS Elastic Beanstalk
- Google Cloud Run
- Azure App Service
- DigitalOcean App Platform
- Railway
- Fly.io

**Frontend:**
- Vercel (recommended for Next.js)
- Netlify
- AWS S3 + CloudFront
- Azure Static Web Apps
- GitHub Pages (with static export)
- Cloudflare Pages

## 📚 Additional Resources

- [Full CI/CD Documentation](.github/WORKFLOWS.md)
- [Contributing Guide](CONTRIBUTING.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

## 💡 Tips

1. **Use pre-commit hooks** - Catches issues before you commit
2. **Run checks locally** - Faster than waiting for CI
3. **Check CI logs** - Click on failed checks to see what went wrong
4. **Keep PRs small** - Easier to review and less likely to fail CI
5. **Update dependencies** - Watch for weekly dependency update issues

## 🆘 Getting Help

If CI fails and you're not sure why:
1. Click on the failed check to see the logs
2. Look for the specific error message (usually at the end)
3. Try to reproduce the issue locally
4. Ask for help in the PR comments
5. Check existing issues for similar problems

---

**Remember**: CI is here to help! It catches issues before they reach production. 🎯
