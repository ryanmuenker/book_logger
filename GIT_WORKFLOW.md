# Git Workflow Best Practices

## Feature Branch Workflow

### 1. **Create a Feature Branch**

Always create a new branch for each feature or bug fix:

```bash
# Make sure you're on main and it's up to date
git checkout main
git pull origin main

# Create and switch to a new feature branch
git checkout -b fix/user-data-isolation

# Or for a new feature:
git checkout -b feature/new-feature-name
```

### 2. **Make Logical Commits**

Commit related changes together with clear, descriptive messages:

```bash
# Stage specific files
git add routes/books.py frontend/src/pages/Books.tsx

# Commit with a clear message
git commit -m "fix: enforce user data isolation in books routes

- Add user-specific /api/books.json endpoint
- Secure book CRUD operations with ownership checks
- Update frontend to use user-specific endpoint
- Show empty state for unauthenticated users

Fixes issue where all users could see each other's books."

# Or commit multiple related changes separately:
git add routes/books.py
git commit -m "fix: secure book routes with user ownership checks"

git add frontend/src/pages/Books.tsx
git commit -m "fix: use user-specific books endpoint in frontend"
```

### 3. **Commit Message Format**

Use conventional commit format:

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `fix:` - Bug fix
- `feat:` - New feature
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
git commit -m "fix: enforce user data isolation in books routes"
git commit -m "feat: add Prometheus metrics endpoint"
git commit -m "docs: update README with deployment instructions"
```

### 4. **Push Your Branch**

```bash
# Push your branch to origin (your fork)
git push origin fix/user-data-isolation

# If it's the first push, set upstream:
git push -u origin fix/user-data-isolation
```

### 5. **Create a Pull Request**

1. Go to your GitHub repository
2. Click "Compare & pull request"
3. Fill in:
   - **Title**: Clear description (e.g., "Fix: Enforce user data isolation")
   - **Description**: Explain what changed and why
   - **Reviewers**: Add if working with a team
4. Link any related issues: `Fixes #123`
5. Wait for CI to pass (tests, coverage checks)
6. Get code review if needed
7. Merge when approved

### 6. **Keep Your Branch Updated**

If `main` has new changes while you're working:

```bash
# Switch to main
git checkout main

# Pull latest changes
git pull origin main

# Switch back to your branch
git checkout fix/user-data-isolation

# Merge or rebase main into your branch
git merge main
# OR
git rebase main

# Push updated branch
git push origin fix/user-data-isolation
```

## Working with Forks

If you're contributing to someone else's repository:

### Setup:
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/book_logger.git
cd book_logger

# Add upstream (original repo)
git remote add upstream https://github.com/ORIGINAL_OWNER/book_logger.git

# Verify remotes
git remote -v
```

### Workflow:
```bash
# 1. Update your fork's main branch
git checkout main
git fetch upstream
git merge upstream/main
git push origin main

# 2. Create feature branch
git checkout -b fix/user-data-isolation

# 3. Make changes and commit
git add .
git commit -m "fix: enforce user data isolation"

# 4. Push to your fork
git push origin fix/user-data-isolation

# 5. Create PR from your fork to upstream
# (Do this on GitHub: fork -> upstream)
```

## Best Practices

### ✅ DO:
- Create feature branches for each change
- Write clear, descriptive commit messages
- Make small, logical commits
- Test before committing
- Keep commits focused (one concern per commit)
- Pull latest changes before starting new work
- Use meaningful branch names (`fix/`, `feat/`, `docs/`)

### ❌ DON'T:
- Commit directly to `main` (unless it's your personal repo and you're sure)
- Commit large files or `node_modules/`
- Commit secrets or `.env` files
- Write vague commit messages like "fix stuff"
- Mix unrelated changes in one commit
- Force push to shared branches

## Current Changes Workflow

For your current bug fix:

```bash
# 1. Create feature branch
git checkout -b fix/user-data-isolation

# 2. Stage your changes (excluding node_modules)
git add routes/books.py
git add frontend/src/pages/Books.tsx
git add .gitignore
git add .github/workflows/ci.yml
git add Dockerfile frontend/Dockerfile docker-compose.yml
git add requirements.txt app.py prometheus.yml
git add README.md REPORT.md

# 3. Commit with clear message
git commit -m "fix: enforce user data isolation in books routes

- Add user-specific /api/books.json endpoint
- Secure book CRUD operations with ownership checks  
- Update frontend to use user-specific endpoint
- Show empty state for unauthenticated users

Fixes issue where all users could see each other's books."

# 4. Push to your fork
git push origin fix/user-data-isolation

# 5. Create PR on GitHub (if using forks) or merge directly
```

