# GitHub Actions Workflows

This document describes all the automated workflows configured for this repository.

## 🔄 Continuous Integration (CI)

**File**: `.github/workflows/ci.yml`

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual workflow dispatch

**Jobs**:

### Backend Lint & Test
- **Matrix**: Python 3.11, 3.12
- **Steps**:
  - Code formatting check (black)
  - Import sorting check (isort)
  - Linting (flake8)
  - Database migrations check
  - Unit tests
  - Security scan (bandit, safety)

### Frontend Lint, Type Check & Build
- **Matrix**: Node.js 20.x, 22.x
- **Steps**:
  - ESLint
  - TypeScript type checking
  - Production build
  - Security audit (npm audit)

### Integration Check
- **Steps**:
  - Start backend server
  - Test API endpoints
  - Verify full-stack integration

### CI Status Check
- **Steps**:
  - Aggregate results from all jobs
  - Report overall CI status

## 🔒 Security Scanning

### CodeQL Analysis

**File**: `.github/workflows/codeql.yml`

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Weekly schedule (Monday at 00:00 UTC)
- Manual workflow dispatch

**Jobs**:
- Python (Backend) semantic code analysis
- JavaScript/TypeScript (Frontend) semantic code analysis

**Query Suites**:
- `security-extended`: Extended security queries
- `security-and-quality`: Security and code quality queries

### Dependency Review

**File**: `.github/workflows/dependency-review.yml`

**Triggers**:
- Pull requests that modify dependency files:
  - `backend/requirements.txt`
  - `frontend/package.json`
  - `frontend/package-lock.json`

**Features**:
- Reviews new dependencies for known vulnerabilities
- Fails on moderate or higher severity issues
- Posts summary comment on PRs

### Dependency Updates

**File**: `.github/workflows/dependency-updates.yml`

**Triggers**:
- Weekly schedule (Monday at 09:00 UTC)
- Manual workflow dispatch

**Features**:
- Scans Python dependencies with pip-audit
- Checks npm packages for updates
- Runs npm security audit
- Creates weekly issue with findings

## 🏷️ Automation

### PR Labeler

**File**: `.github/workflows/pr-labeler.yml`

**Triggers**:
- Pull request opened, synchronized, or reopened

**Labels Applied**:
- `backend`: Changes in `backend/**/*`
- `frontend`: Changes in `frontend/**/*`
- `dependencies`: Changes in dependency files
- `documentation`: Changes in `*.md` or `docs/**/*`
- `ci/cd`: Changes in `.github/**/*`

**Configuration**: `.github/labeler.yml`

## 🚀 Deployment

### Deploy to Production

**File**: `.github/workflows/deploy.yml`

**Triggers**:
- Release published
- Manual workflow dispatch (with environment selection)

**Environments**:
- Staging
- Production

**Jobs**:
- Deploy Backend (with migrations and static file collection)
- Deploy Frontend (with production build)
- Health Check (post-deployment validation)

**Note**: This is a template workflow. Configure your deployment targets before using.

## 📊 Workflow Status

View live status of all workflows:

- [CI Workflow](../../actions/workflows/ci.yml)
- [CodeQL Analysis](../../actions/workflows/codeql.yml)
- [Dependency Review](../../actions/workflows/dependency-review.yml)
- [Dependency Updates](../../actions/workflows/dependency-updates.yml)
- [PR Labeler](../../actions/workflows/pr-labeler.yml)
- [Deploy](../../actions/workflows/deploy.yml)

## 🔧 Maintenance

### Updating Workflows

1. Edit workflow files in `.github/workflows/`
2. Test changes in a feature branch
3. Create a pull request
4. Verify CI passes with the updated workflows
5. Merge to main

### Adding New Workflows

1. Create new `.yml` file in `.github/workflows/`
2. Define triggers, jobs, and steps
3. Test in a feature branch
4. Document the workflow in this file
5. Update README.md if necessary

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [CodeQL Documentation](https://codeql.github.com/docs/)
