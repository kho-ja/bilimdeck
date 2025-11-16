# .github Directory

This directory contains all GitHub-specific configurations, workflows, templates, and documentation for the BilimDeck project.

## 📁 Directory Structure

```
.github/
├── workflows/              # GitHub Actions workflows
│   ├── ci.yml             # Main CI/CD pipeline
│   ├── codeql.yml         # Security analysis
│   ├── dependency-review.yml
│   ├── dependency-updates.yml
│   ├── deploy.yml         # Deployment template
│   └── pr-labeler.yml     # Automatic PR labeling
├── ISSUE_TEMPLATE/        # Issue templates
│   ├── bug_report.md      # Bug report template
│   ├── feature_request.md # Feature request template
│   ├── cicd_issue.md      # CI/CD issue template
│   └── config.yml         # Issue template config
├── PULL_REQUEST_TEMPLATE.md # PR template
├── labeler.yml            # PR labeler configuration
├── WORKFLOWS.md           # Workflow documentation
├── CI_QUICKREF.md         # Quick reference guide
├── CI_CD_SUMMARY.md       # Implementation summary
├── ARCHITECTURE.md        # Pipeline architecture
├── BADGES.md              # Status badges
└── README.md              # This file
```

## 🔄 GitHub Actions Workflows

### 1. CI Pipeline (`workflows/ci.yml`)
**Triggers**: Push to main/develop, PRs, manual
**Purpose**: Comprehensive continuous integration
**Jobs**:
- Backend testing (Python 3.11, 3.12)
- Frontend testing (Node.js 20.x, 22.x)
- Integration testing
- Status aggregation

**Duration**: ~5 minutes
**Required**: ✅ Blocks PR merging

### 2. CodeQL Security (`workflows/codeql.yml`)
**Triggers**: Push, PRs, weekly schedule, manual
**Purpose**: Advanced security analysis
**Languages**: Python, JavaScript/TypeScript
**Duration**: ~5 minutes

### 3. Dependency Review (`workflows/dependency-review.yml`)
**Triggers**: PRs that modify dependency files
**Purpose**: Review new dependencies for vulnerabilities
**Action**: Fails on moderate+ severity issues

### 4. Dependency Updates (`workflows/dependency-updates.yml`)
**Triggers**: Weekly (Monday 9AM UTC), manual
**Purpose**: Monitor dependency security
**Action**: Creates issues with vulnerability reports

### 5. PR Labeler (`workflows/pr-labeler.yml`)
**Triggers**: PR open/update
**Purpose**: Automatically label PRs
**Labels**: backend, frontend, dependencies, docs, ci/cd

### 6. Deploy (`workflows/deploy.yml`)
**Triggers**: Release published, manual
**Purpose**: Deployment template
**Status**: Ready to customize for your infrastructure

## 📝 Templates

### Pull Request Template
- Comprehensive checklist
- Type of change selection
- Testing requirements
- Security considerations
- Clear guidelines

### Issue Templates
1. **Bug Report**: Structured bug reporting
2. **Feature Request**: Feature proposal format
3. **CI/CD Issue**: Workflow-specific issues

## 📚 Documentation Files

### [WORKFLOWS.md](WORKFLOWS.md)
Complete reference for all workflows including:
- Trigger conditions
- Job descriptions
- Configuration details
- Maintenance guide

### [CI_QUICKREF.md](CI_QUICKREF.md)
Quick reference guide with:
- Status checks table
- Local setup commands
- Quick fixes for common issues
- Tips and tricks

### [CI_CD_SUMMARY.md](CI_CD_SUMMARY.md)
Comprehensive implementation summary:
- What was implemented
- Features and benefits
- Architecture overview
- Customization guide

### [ARCHITECTURE.md](ARCHITECTURE.md)
Visual pipeline architecture:
- Flow diagrams
- Job dependencies
- Performance metrics
- Time estimates

### [BADGES.md](BADGES.md)
Status badge documentation:
- CI/CD badges
- Tech stack badges
- Code quality badges
- Custom badge guide

## 🔧 Configuration Files

### `labeler.yml`
Configures automatic PR labeling based on file paths:
```yaml
backend:
  - changed-files:
    - any-glob-to-any-file: 'backend/**/*'
```

## 🚀 Quick Start

### For New Contributors
1. Read [CONTRIBUTING.md](../CONTRIBUTING.md)
2. Check [CI_QUICKREF.md](CI_QUICKREF.md) for commands
3. Use PR template when opening PRs
4. Use issue templates for bugs/features

### For Maintainers
1. Review [WORKFLOWS.md](WORKFLOWS.md) for workflow details
2. Check [CI_CD_SUMMARY.md](CI_CD_SUMMARY.md) for implementation overview
3. Customize [deploy.yml](workflows/deploy.yml) for your infrastructure
4. Monitor weekly dependency update issues

## 📊 Workflow Status

View all workflow runs:
- [CI Workflow](../../actions/workflows/ci.yml)
- [CodeQL Analysis](../../actions/workflows/codeql.yml)
- [Dependency Review](../../actions/workflows/dependency-review.yml)
- [Dependency Updates](../../actions/workflows/dependency-updates.yml)
- [PR Labeler](../../actions/workflows/pr-labeler.yml)
- [Deploy](../../actions/workflows/deploy.yml)

## 🔒 Security

All workflows follow security best practices:
- ✅ Minimal GITHUB_TOKEN permissions
- ✅ Dependency vulnerability scanning
- ✅ Code security analysis (CodeQL)
- ✅ Regular security audits
- ✅ No secrets in code

## 📈 Metrics

### Code Coverage
- Backend: Django test suite
- Frontend: Build verification
- Integration: API health checks

### Code Quality
- Python: black, isort, flake8
- TypeScript: ESLint, type checking
- Security: bandit, npm audit

## 🛠️ Maintenance

### Updating Workflows
1. Edit workflow files in `workflows/`
2. Test in feature branch
3. Verify CI passes
4. Merge to main

### Adding New Workflows
1. Create new `.yml` in `workflows/`
2. Define triggers and jobs
3. Test thoroughly
4. Document in WORKFLOWS.md

### Modifying Templates
1. Edit template files
2. Test with actual PRs/issues
3. Update documentation
4. Roll out gradually

## 🆘 Troubleshooting

### Workflow Failures
1. Check workflow logs
2. Review [CI_QUICKREF.md](CI_QUICKREF.md) for common fixes
3. Run checks locally
4. Open CI/CD issue if needed

### Template Issues
1. Check template syntax
2. Verify YAML formatting
3. Test with real use cases
4. Update as needed

## 📞 Support

- **Quick Help**: [CI_QUICKREF.md](CI_QUICKREF.md)
- **Detailed Docs**: [WORKFLOWS.md](WORKFLOWS.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Implementation**: [CI_CD_SUMMARY.md](CI_CD_SUMMARY.md)
- **Issues**: Use CI/CD issue template

## 🎯 Goals

This CI/CD setup aims to:
- ✅ Catch issues early and automatically
- ✅ Provide fast feedback to developers
- ✅ Ensure code quality and security
- ✅ Automate repetitive tasks
- ✅ Make contributing easier
- ✅ Maintain high standards

---

**Last Updated**: 2025-11-16
**Version**: 1.0
**Maintainer**: BilimDeck Team
