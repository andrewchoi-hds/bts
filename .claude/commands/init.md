# /init - Project Initialization

Analyze the current project and set up session context.

## Instructions

You are the **Explorer Agent**. Perform a comprehensive project analysis.

### Step 1: Detect Project Root Files

Search for these files in the current directory:

**Package Managers & Build Tools:**
- `package.json` (Node.js/JavaScript/TypeScript)
- `pyproject.toml`, `setup.py`, `requirements.txt` (Python)
- `Cargo.toml` (Rust)
- `go.mod` (Go)
- `pom.xml`, `build.gradle` (Java/Kotlin)
- `Gemfile` (Ruby)
- `composer.json` (PHP)

**Configuration Files:**
- `tsconfig.json`, `jsconfig.json`
- `.eslintrc.*`, `.prettierrc.*`
- `vite.config.*`, `webpack.config.*`, `next.config.*`, `nuxt.config.*`
- `tailwind.config.*`
- `docker-compose.yml`, `Dockerfile`
- `.github/workflows/`

**Documentation:**
- `README.md`, `CLAUDE.md`
- `.env.example`

### Step 2: Analyze Dependencies

If `package.json` exists, check dependencies for:
- **Frontend**: react, vue, svelte, angular, next, nuxt, solid
- **Mobile**: react-native, expo
- **Backend**: express, fastify, nestjs, hono, koa
- **Testing**: jest, vitest, mocha, playwright, cypress
- **Styling**: tailwindcss, styled-components, emotion

If `pyproject.toml` or `requirements.txt` exists, check for:
- **Backend**: fastapi, django, flask, starlette
- **Data/ML**: pandas, numpy, torch, tensorflow, scikit-learn
- **Testing**: pytest

### Step 3: Detect Directory Structure

Check for presence of:
- `src/`, `app/`, `pages/`, `components/` → Frontend patterns
- `routes/`, `controllers/`, `services/`, `models/` → Backend patterns
- `ios/`, `android/` → Mobile patterns
- `.storybook/`, `design-tokens/`, `theme/` → Design system
- `notebooks/`, `models/`, `data/` → Data/ML patterns
- `k8s/`, `terraform/`, `ansible/` → DevOps/Infra
- `.github/ISSUE_TEMPLATE/`, `CHANGELOG.md` → PM patterns

### Step 4: Determine Domain

Based on analysis, assign:
- **Primary Domain**: The main focus of the project
- **Secondary Domain(s)**: Supporting aspects

### Step 5: Extract Commands

From package.json scripts or detected tools:
- Test command
- Build command
- Lint command
- Dev/Start command

### Step 6: Output Format

Present the results in this exact format:

```
## Project Analysis Complete

**Project**: [project name from package.json or directory name]
**Path**: [current working directory]

### Tech Stack
- **Language**: [primary language]
- **Framework**: [main framework]
- **Runtime**: [Node.js version, Python version, etc. if detectable]

### Domain Classification
- **Primary**: [Frontend | Backend | Mobile | Data/ML | DevOps | Design]
- **Secondary**: [list or "None"]

### Commands
- **Test**: `[test command]`
- **Build**: `[build command]`
- **Lint**: `[lint command]`
- **Dev**: `[dev command]`

### Key Files
- **Entry Point**: [main file path]
- **Config**: [list key config files]

### Directory Structure (depth 2)
[brief tree structure of main directories]
```

## Options

- `--deep`: Perform deeper analysis including dependency tree and file counts

## Error Handling

If no recognizable project files found:
```
## Error: UNSUPPORTED

Could not detect project type.

### Cause
No recognized package manager or build tool configuration found.

### Solution
1. Ensure you're in the project root directory
2. Create a package.json, pyproject.toml, or other config file
3. Manually specify the project type

### Alternative
Run `/map` to see the directory structure and identify project files manually.
```

## Notes

- This analysis sets the context for all subsequent commands
- Domain detection affects which specialized advice is given
- Detected commands are used by /test, /build, etc.
