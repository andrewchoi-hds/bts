# /todo - TODO Management

Manage project TODOs and track tasks from code comments.

## Instructions

You are the **PM Agent**. Track and manage TODO items across the project.

### Usage

```
/todo [action] [args]
```

### Actions

| Action | Description | Example |
|--------|-------------|---------|
| (none) | List all TODOs | `/todo` |
| `scan` | Scan codebase for TODO comments | `/todo scan` |
| `add` | Add a new TODO | `/todo add "Fix auth bug" --priority=P1` |
| `done` | Mark TODO as complete | `/todo done 3` |
| `remove` | Remove a TODO | `/todo remove 5` |
| `clear` | Remove all completed | `/todo clear` |
| `export` | Export to file | `/todo export --format=md` |

### Priority Levels

| Level | Label | Description | SLA |
|-------|-------|-------------|-----|
| **P1** | Critical | Blocking issue, security vulnerability | Immediate |
| **P2** | High | Affects current sprint/feature | This session |
| **P3** | Medium | Should be done soon (default) | Next session |
| **P4** | Low | Nice to have, tech debt | When time permits |

### Scan Patterns

The `/todo scan` action searches for these patterns:

```
// TODO: message
// TODO(author): message
// FIXME: message
// HACK: message
// XXX: message
/* TODO: message */
# TODO: message (Python, Ruby, Shell)
-- TODO: message (SQL)
@todo message (JSDoc)
```

**Priority hints in comments**:
```
// TODO(P1): Critical fix needed
// FIXME: URGENT - security issue
// TODO: [HIGH] refactor this
```

### Action: List (default)

Show all TODOs for the current project.

**Output Format**:
```
## TODOs: [project-name]

**Total**: 12 items (4 from code, 8 manual)
**Last Scan**: 2024-01-15 10:30

---

### 🔴 P1 - Critical (2)

| # | Task | Location | Added |
|---|------|----------|-------|
| 1 | Fix SQL injection in user query | `src/api/users.ts:45` | Code |
| 2 | Update expired SSL certificate | Manual | Jan 15 |

---

### 🟠 P2 - High (3)

| # | Task | Location | Added |
|---|------|----------|-------|
| 3 | Add input validation to form | `src/components/Form.tsx:89` | Code |
| 4 | Implement rate limiting | Manual | Jan 14 |
| 5 | Fix memory leak in useEffect | `src/hooks/useData.ts:23` | Code |

---

### 🟡 P3 - Medium (5)

| # | Task | Location | Added |
|---|------|----------|-------|
| 6 | Refactor legacy utils | `src/utils/old.ts:10` | Code |
| 7 | Add unit tests for API | Manual | Jan 13 |
| ... | | | |

---

### 🟢 P4 - Low (2)

| # | Task | Location | Added |
|---|------|----------|-------|
| 11 | Update README | Manual | Jan 10 |
| 12 | Add TypeScript strict mode | Manual | Jan 8 |

---

### Commands
- Mark done: `/todo done [#]`
- Add new: `/todo add "task" --priority=P2`
- Rescan: `/todo scan`
```

### Action: Scan

Scan the codebase for TODO comments.

```
/todo scan [path] [--include=PATTERN] [--exclude=PATTERN]
```

**Options**:
- `path`: Directory to scan (default: project root)
- `--include`: File pattern to include (e.g., `*.ts`)
- `--exclude`: File pattern to exclude

**Exclusions (automatic)**:
- `node_modules/`, `.git/`, `dist/`, `build/`
- `*.min.js`, `*.lock`, `*.log`
- Binary files

**Output**:
```
## Scan Results

**Scanned**: 156 files
**Found**: 8 new TODOs
**Updated**: 2 existing
**Resolved**: 1 (code removed)

### New TODOs Found

| Priority | Task | Location |
|----------|------|----------|
| P2 | Add error handling | `src/api.ts:67` |
| P3 | Refactor this function | `src/utils.ts:120` |
| ... | | |

### Resolved (no longer in code)

| Task | Was at |
|------|--------|
| Fix typo in message | `src/i18n/en.ts:45` |

TODOs updated. Run `/todo` to see full list.
```

### Action: Add

Add a manual TODO item.

```
/todo add "task description" [--priority=P1-P4] [--tag=TAG]
```

**Options**:
- `--priority`: P1, P2, P3 (default), or P4
- `--tag`: Category tag (e.g., `api`, `ui`, `test`)

**Example**:
```
/todo add "Implement user authentication" --priority=P2 --tag=auth
```

**Output**:
```
✅ Added TODO #13

**Task**: Implement user authentication
**Priority**: P2 (High)
**Tag**: auth
**Added**: 2024-01-15 11:00

Run `/todo` to see updated list.
```

### Action: Done

Mark a TODO as completed.

```
/todo done [number|all]
```

**Examples**:
```
/todo done 5        # Mark #5 as done
/todo done 1,3,5    # Mark multiple
/todo done all      # Mark all as done (with confirmation)
```

**Output**:
```
✅ Completed TODO #5

**Task**: Add input validation to form
**Was**: P2 (High)
**Duration**: 2 days

Remaining: 11 items (1 P1, 2 P2, 6 P3, 2 P4)
```

### Action: Export

Export TODOs to a file.

```
/todo export [--format=FORMAT] [--output=FILE]
```

**Formats**:
- `md`: Markdown (default)
- `json`: JSON
- `csv`: CSV

**Output (Markdown)**:
```markdown
# Project TODOs

Generated: 2024-01-15

## Critical (P1)

- [ ] Fix SQL injection in user query (`src/api/users.ts:45`)
- [ ] Update expired SSL certificate

## High (P2)

- [ ] Add input validation to form (`src/components/Form.tsx:89`)
...
```

### State Storage

TODOs are persisted in `~/.claude/state/todos.json`:

```json
{
  "version": "1.0",
  "projects": {
    "/path/to/project": {
      "items": [
        {
          "id": "uuid-1234",
          "content": "Fix SQL injection",
          "priority": "P1",
          "source": "scan",
          "location": "src/api/users.ts:45",
          "created": "2024-01-15T10:00:00Z",
          "completed": null,
          "tags": ["security", "api"]
        }
      ],
      "lastScan": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Error Handling

**No TODOs**:
```
## No TODOs Found

This project has no tracked TODOs.

### Get Started
1. `/todo scan` - Find TODOs in code comments
2. `/todo add "task"` - Add a manual TODO
```

**Invalid number**:
```
## Error: NOT_FOUND

TODO #[number] does not exist.

### Available
Total: 12 items (1-12)

Run `/todo` to see the list.
```

## Examples

**View all TODOs**:
```
/todo
```

**Scan for TODOs in code**:
```
/todo scan
```

**Scan specific directory**:
```
/todo scan src/api
```

**Add high-priority TODO**:
```
/todo add "Fix authentication bypass" --priority=P1 --tag=security
```

**Mark as done**:
```
/todo done 3
```

**Export to markdown**:
```
/todo export --format=md --output=TODO.md
```

## Notes

- TODOs persist across sessions in `~/.claude/state/todos.json`
- Code-sourced TODOs update on each scan
- Manual TODOs remain until explicitly removed
- Use tags to filter and organize tasks
- Integrates with `/review` to check for unresolved TODOs
