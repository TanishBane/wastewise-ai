# Contributing to WasteWise AI

Thank you for your interest in contributing to **WasteWise AI**! We welcome contributions from developers, data scientists, food-service domain experts, and culinary operations enthusiasts.

This guide outlines our development workflow, coding standards, testing requirements, and pull request procedures.

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Be respectful, constructive, and open to feedback.

---

## Architecture & Tenets

Before making changes, please review:
- [`ARCHITECTURE.md`](ARCHITECTURE.md): System architecture, persistence layers, and model isolation.
- [`PRODUCT.md`](PRODUCT.md): Core user workflows and domain constraints.
- [`DEPLOYMENT.md`](DEPLOYMENT.md): Deployment targets and database migration paths.

### Core Development Principles
1. **Evidence Before Claims**: Never claim a test, build, or fix succeeds without verifying the fresh execution output.
2. **Demo-First Zero-Friction Invariant**: Public interactive demo mode (`WASTEWISE_DEMO_MODE=true`) must run out-of-the-box with zero accounts, zero login barriers, and zero cloud database dependencies.
3. **Mathematical Baseline Integrity**: Core demonstration baseline figures (161 demand portions, 168 recommended prep, 7 portions surplus risk, ₹887 cost at risk, 8.4% holdout WAPE) must remain deterministic and reproducible.
4. **Clean Layer Separation**: Keep ML mathematical logic in `src/` and service routines in `backend/services/`, completely decoupled from HTTP routing.
5. **Botanical Editorial Design**: Frontend views adhere to our natural culinary palette (`#14392f`, `#f6f5ef`, `#76947f`, `#805142`), Newsreader serif headings, Plus Jakarta Sans body, and WCAG AA contrast standards.

---

## Local Development Setup

### Prerequisites
- **Python**: Version 3.10 to 3.14
- **Node.js**: Version 18.x or 20.x+
- **npm**: Version 9.x or 10.x+
- **Git**

### 1. Fork & Clone Repository
```bash
git clone https://github.com/TanishBane/wastewise-ai.git
cd wastewise-ai
```

### 2. Backend Setup
Create a virtual environment and install dependencies:

**On Linux/macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**On Windows (PowerShell):**
```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Start the FastAPI backend:
```bash
uvicorn backend.main:app --reload --port 8000
```
API docs will be available at `http://localhost:8000/docs`.

### 3. Frontend Setup
Navigate to the `frontend/` directory and install npm packages:
```bash
cd frontend
npm install
npm run dev
```
The React development server runs on `http://localhost:5173/`.

---

## Testing & Quality Gates

Every pull request must pass the automated CI pipeline (`.github/workflows/ci.yml`).

### Backend Verification
Run the 59-item automated test suite with pytest:
```bash
pytest
```
Ensure all tests pass with zero failures:
```
======================= 59 passed in ~40s =======================
```

### Frontend Verification
Run the linting, code style formatting, and TypeScript build checks:
```bash
cd frontend

# Run Oxlint (fast Rust-based linter)
npm run lint

# Check Prettier code formatting
npm run format:check

# Validate TypeScript types and bundle build
npm run build
```

---

## Branching & Commit Conventions

### Branch Naming
Create focused, descriptive branches:
- `feat/feature-name` — New user-facing feature or enhancement.
- `fix/bug-description` — Defect remediation.
- `docs/documentation-update` — Documentation, guides, or branding assets.
- `refactor/clean-architecture` — Code reorganization without functional changes.
- `test/new-evaluations` — Test suites or model evaluation scripts.

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) format:
```
<type>(<scope>): <short summary>

[optional body explaining context, rationale, and alternatives considered]
```
Examples:
- `feat(forecast): add hourly weather degradation factor to RF regressor`
- `fix(planner): resolve inventory deduction underflow in batch 2 trigger`
- `docs(readme): update system architecture diagrams and screenshot gallery`

---

## Pull Request Guidelines

1. **Keep PRs Focused**: One logical concern per pull request. Avoid mixing unrelated style changes with core logic.
2. **Include Verification Evidence**: Paste output from `pytest` and `npm run build` in your PR description.
3. **Include Screenshots**: For frontend changes, attach desktop (1440px) and mobile (390px) screenshots.
4. **No Secrets**: Never commit `.env` files, production database connection strings, or private tokens.
5. **Preserve Attribution**: All original code is distributed under the MIT License (`Copyright (c) 2026 Tanish Bane`).

---

## Questions and Support

- For technical discussions and feature proposals, open a [GitHub Discussion](https://github.com/TanishBane/wastewise-ai/discussions).
- For defects or verifiable bugs, file an issue with full reproduction steps.
