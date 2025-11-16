# Contributing to BilimDeck

Thank you for your interest in contributing to BilimDeck! This document provides guidelines and information about our development process.

## 🔄 CI/CD Pipeline

All pull requests go through automated checks before they can be merged. Understanding these checks will help you prepare your contributions.

### Required Checks

#### 1. Backend Checks
- **Code Formatting**: Code must be formatted with `black`
- **Import Sorting**: Imports must be sorted with `isort`
- **Linting**: Code must pass `flake8` checks
- **Tests**: All Django tests must pass
- **Security**: No high-severity security issues

#### 2. Frontend Checks
- **ESLint**: Code must pass ESLint rules
- **TypeScript**: No type errors allowed
- **Build**: Application must build successfully
- **Security**: No high-severity npm vulnerabilities

#### 3. Integration Checks
- **API Health**: Backend API must be accessible
- **Full Stack**: Frontend and backend must integrate properly

## 🚀 Getting Started

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/bilimdeck.git
cd bilimdeck
```

### 2. Set Up Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install black isort flake8  # Dev dependencies
python manage.py migrate
python manage.py test
```

### 3. Set Up Frontend

```bash
cd frontend
npm install
npm run lint
npm run build
```

## 📝 Making Changes

### Before Committing

#### Backend
```bash
cd backend

# Format code
black .
isort .

# Check for issues
flake8 .

# Run tests
python manage.py test
```

#### Frontend
```bash
cd frontend

# Lint
npm run lint

# Type check
npx tsc --noEmit

# Test build
npm run build
```

### Commit Messages

Follow conventional commits format:

- `feat: add new feature`
- `fix: bug fix`
- `docs: documentation changes`
- `style: formatting, missing semi colons, etc`
- `refactor: code restructuring`
- `test: adding tests`
- `chore: updating build tasks, package manager configs, etc`

## 🔍 Pull Request Process

1. **Create a feature branch**: `git checkout -b feature/your-feature-name`
2. **Make your changes**: Follow the coding standards
3. **Test locally**: Run all checks before pushing
4. **Push to your fork**: `git push origin feature/your-feature-name`
5. **Open a Pull Request**: Describe your changes clearly
6. **Wait for CI**: All automated checks must pass
7. **Address feedback**: Respond to review comments
8. **Get merged**: Once approved, your PR will be merged!

## 🏷️ PR Labels

PRs are automatically labeled based on changed files:

- `backend`: Changes to backend code
- `frontend`: Changes to frontend code
- `dependencies`: Changes to package files
- `documentation`: Changes to markdown files
- `ci/cd`: Changes to GitHub Actions workflows

## 🔒 Security

- Never commit secrets or API keys
- Run security scans before submitting PRs
- Report security vulnerabilities privately to the maintainers

### Backend Security Scan
```bash
cd backend
pip install bandit safety
bandit -r . -ll
safety check
```

### Frontend Security Scan
```bash
cd frontend
npm audit
```

## 📚 Code Style

### Python (Backend)
- Follow PEP 8 style guide
- Use `black` for formatting (line length: 127)
- Use `isort` for import sorting
- Maximum complexity: 10
- Add docstrings for classes and functions

### TypeScript (Frontend)
- Follow Next.js and React best practices
- Use TypeScript for type safety
- Follow ESLint rules
- Use meaningful variable names
- Keep components small and focused

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Adding Backend Tests
Create test files in the `tests.py` file of each Django app:

```python
from django.test import TestCase

class MyTestCase(TestCase):
    def test_something(self):
        # Your test code
        self.assertEqual(1 + 1, 2)
```

### Frontend Tests (Future)
Currently, the project doesn't have frontend tests, but we plan to add them using Jest and React Testing Library.

## 🤝 Getting Help

- Open an issue for bugs or feature requests
- Ask questions in pull request comments
- Check existing issues and PRs for similar topics

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to BilimDeck! 🎉
