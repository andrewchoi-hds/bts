# /map - Project Structure Mapping

Visualize the project directory structure in a token-efficient format.

## Instructions

You are the **Explorer Agent**. Create a visual map of the project structure.

### Usage

```
/map [path] [--depth=N] [--focus=AREA]
```

### Parameters

- **path**: Starting directory (default: current directory `.`)
- **--depth=N**: How deep to traverse (default: 3, max: 5)
- **--focus=AREA**: Focus on specific area
  - `components`: UI components
  - `api`: API routes and handlers
  - `tests`: Test files
  - `config`: Configuration files
  - `styles`: Stylesheets and design tokens

### Exclusion Rules (Always Apply)

**NEVER** include these directories:
- `node_modules/`
- `.git/`
- `dist/`, `build/`, `out/`
- `.next/`, `.nuxt/`, `.svelte-kit/`
- `__pycache__/`, `.pytest_cache/`
- `venv/`, `.venv/`, `env/`
- `coverage/`
- `.turbo/`, `.cache/`
- `target/` (Rust)
- `vendor/` (Go, PHP)

**NEVER** list these files:
- `*.lock` (package-lock.json, yarn.lock, pnpm-lock.yaml, etc.)
- `*.log`
- `.DS_Store`
- `*.map` (source maps)

### Output Format

Use this tree format with annotations:

```
project-name/
├── src/                    # Source code
│   ├── components/         # React components [15 files]
│   │   ├── common/         # Shared components [5]
│   │   ├── features/       # Feature-specific [8]
│   │   └── layout/         # Layout components [2]
│   ├── hooks/              # Custom React hooks [8 files]
│   ├── services/           # API services [4 files]
│   │   └── api.ts          # ★ Main API client
│   ├── utils/              # Utility functions [6 files]
│   └── types/              # TypeScript types [3 files]
├── tests/                  # Test files [12 files]
├── public/                 # Static assets
├── package.json            # ★ Project config
├── tsconfig.json           # TypeScript config
└── README.md               # Documentation
```

### Annotation Guidelines

1. **File counts**: Show `[N files]` for directories with many files
2. **Key files**: Mark important files with `★`
3. **Purpose comments**: Add brief `# comment` for non-obvious directories
4. **Collapse large dirs**: If a directory has 10+ items, summarize

### Key Files to Highlight (★)

- Entry points: `index.ts`, `main.ts`, `app.ts`, `page.tsx`
- Config files: `package.json`, `tsconfig.json`, `vite.config.ts`
- API definitions: `api.ts`, `routes.ts`, `schema.prisma`
- Main components: `App.tsx`, `Layout.tsx`
- Documentation: `README.md`, `CLAUDE.md`

### Focus Mode Examples

**--focus=components**:
```
src/components/
├── common/
│   ├── Button.tsx          # Primary button
│   ├── Input.tsx           # Form input
│   ├── Modal.tsx           # Modal dialog
│   └── index.ts            # ★ Exports
├── features/
│   ├── auth/               # Authentication [4 files]
│   ├── dashboard/          # Dashboard [6 files]
│   └── settings/           # Settings [3 files]
└── layout/
    ├── Header.tsx
    ├── Sidebar.tsx
    └── Footer.tsx
```

**--focus=api**:
```
src/
├── routes/
│   ├── users.ts            # /api/users
│   ├── posts.ts            # /api/posts
│   └── auth.ts             # /api/auth
├── controllers/
│   └── [matching structure]
├── services/
│   └── [business logic]
└── middleware/
    ├── auth.ts             # Authentication
    └── validation.ts       # Request validation
```

### Token Optimization

1. **Summarize similar files**: Instead of listing 20 test files, show `tests/ [20 files]`
2. **Group by pattern**: `components/*.tsx [15 files]` instead of listing each
3. **Skip obvious contents**: Don't expand `public/` if it just has images
4. **Depth control**: Respect --depth to avoid over-expansion

### Error Handling

**Path not found**:
```
## Error: NOT_FOUND

Path does not exist: [specified path]

### Solution
1. Check the path spelling
2. Use `/map` without arguments to see current directory
3. Available directories: [list top-level dirs]
```

**Empty directory**:
```
## Note

Directory is empty or contains only excluded files.
```

## Examples

**Basic usage**:
```
/map
```

**Specific path with depth**:
```
/map src --depth=4
```

**Focus on API structure**:
```
/map --focus=api
```

## Notes

- Results can be reused in the session to avoid repeated exploration
- Use this before making changes to understand the codebase layout
- Combine with `/init` for complete project understanding
