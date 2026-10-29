# MindGuardAI Contribution & Development Guidelines

Welcome to the MindGuardAI development team. This document outlines branch conventions, code review criteria, and clinical safety standards required when developing features.

---

## 1. Branch Strategy & Environments
- **`main`**: Production-ready, verified codebase. Releases to AWS infrastructure originate from here.
- **`anoushka-dev`**: Active feature development and staging branch for core wellness modules, frontend enhancements, and clinical validation.
- **`feature/<name>`**: Feature-specific branches branched off `anoushka-dev` or `main`.

---

## 2. Clinical Engineering Principles
1. **Safety First**: Any feature touching mental distress classification must adhere to the non-diagnostic clinical safety net standard.
2. **Zero Keystroke Privacy**: Never capture or store raw text input from external applications.
3. **Deterministic Testing**: All algorithmic scoring changes must pass `scripts/test_all_features.py` (36/36 test cases).
4. **Mobile First**: All UI components must be validated across mobile phone viewports (360px–420px) with responsive touch handlers.

---

## 3. Local Verification Before Pushing
Run the following checks locally:
```bash
# 1. Backend tests
python -u scripts/test_all_features.py

# 2. Frontend typecheck & build
cd frontend
npx tsc --noEmit
npm run build
```
