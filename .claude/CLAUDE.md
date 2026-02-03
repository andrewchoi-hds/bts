# Global Claude Code Configuration

## Language Rule

- 모든 응답과 출력은 **한국어**로 작성합니다.
- 코드, 파일명, 기술 용어는 영어 유지 가능합니다.
- 에러 메시지, 분석 결과, 설명 모두 한국어로 출력합니다.

## Token Optimization Principles

1. **Delegate exploration tasks** to Explorer agent (use Task tool with subagent_type=Explore)
2. **Read only necessary lines** from large files (use offset, limit parameters)
3. **Cache repeated searches** - reuse /map and /init results within session
4. **Skip irrelevant files** - focus on files related to the current task
5. **Summarize directory contents** - show file counts instead of listing all files

## Default Workflow

1. **New project**: Run `/init` first to detect stack and set context
2. **Understand structure**: Run `/map` to visualize project layout
3. **Before changes**: Read only the relevant files
4. **After implementation**: Run `/test` to verify
5. **Before PR**: Run `/review staged` to check changes

## Forbidden Actions

- **DO NOT** read files inside: `node_modules/`, `.git/`, `dist/`, `build/`, `__pycache__/`, `.next/`, `.nuxt/`
- **DO NOT** output contents of sensitive files: `.env`, `.env.*`, `credentials.*`, `secrets.*`, `*.pem`, `*.key`
- **DO NOT** process large binary files: images, fonts, videos, compiled binaries
- **AVOID** reading files over 1000 lines in full - use offset/limit or search specific patterns

## Project Type Detection

### Node.js / JavaScript / TypeScript
**Detected by**: `package.json`

```
Test: npm test | yarn test | pnpm test
Build: npm run build | yarn build | pnpm build
Lint: npm run lint | yarn lint | pnpm lint
```

### Python
**Detected by**: `pyproject.toml`, `setup.py`, `requirements.txt`

```
Test: pytest | python -m pytest
Lint: ruff check | flake8 | pylint
Format: ruff format | black
```

### Go
**Detected by**: `go.mod`

```
Test: go test ./...
Build: go build
Lint: golangci-lint run
```

### Rust
**Detected by**: `Cargo.toml`

```
Test: cargo test
Build: cargo build --release
Lint: cargo clippy
```

## Domain Agent Selection

When a domain is detected, apply the corresponding agent context:

| Detection | Primary Domain | Secondary |
|-----------|---------------|-----------|
| react, vue, svelte, next, nuxt in package.json | Frontend | - |
| react-native, expo in package.json | Mobile | Frontend |
| express, fastify, nestjs, hono in package.json | Backend | - |
| fastapi, django, flask in pyproject.toml | Backend | - |
| pandas, numpy, torch, tensorflow in pyproject.toml | Data/ML | Backend |
| .storybook/, design-tokens/ directories | Design | Frontend |
| Dockerfile + k8s/, terraform/ | DevOps | - |
| .github/ISSUE_TEMPLATE/, CHANGELOG.md | PM | (auxiliary) |

### Composite Projects
- **Next.js + Prisma**: Frontend (primary) + Backend (secondary)
- **React + Storybook**: Frontend (primary) + Design (secondary)
- **FastAPI + PyTorch**: Backend (primary) + Data/ML (secondary)

## Error Handling Policy

1. **File/path not found**: Clear error message + suggest similar paths
2. **Permission denied**: Ask user to check permissions
3. **Timeout**: Suggest splitting the task or background execution
4. **Parse error**: Show syntax error location + fix suggestion
5. **Unsupported project**: Provide manual configuration guide

### Error Message Format
```
## Error: [CATEGORY]

[Clear description]

### Cause
[Why it happened]

### Solution
1. [First option]
2. [Second option]

### Alternative
[Workaround if available]
```

## Custom Commands Available

The following slash commands are available globally:

| Command | Description | Agent |
|---------|-------------|-------|
| `/init` | Analyze project and set context | Explorer |
| `/map` | Visualize project structure | Explorer |
| `/analyze` | Code quality analysis | Reviewer + Domain |
| `/review` | Review code changes | Reviewer + Domain |
| `/test` | Run or generate tests | Tester + Domain |
| `/doc` | Generate documentation | Documenter |
| `/todo` | Manage TODO items | PM |
| `/tdd` | TDD workflow guide | Tester + Domain |
| `/deploy` | Deployment checklist | DevOps |
| `/optimize` | Optimization analysis | Domain |

## Session Context

After running `/init`, the following information is stored for the session:
- Detected language and framework
- Primary and secondary domains
- Test, build, and lint commands
- Entry point file
- Key configuration files

This context is automatically used by subsequent commands.
