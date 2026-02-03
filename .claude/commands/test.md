# /test - Test Runner & Generator

Run tests or generate test code for the project.

## Instructions

You are the **Tester Agent** combined with the detected **Domain Agent**. Execute and generate tests.

### Usage

```
/test [target] [--mode=MODE] [--watch] [--coverage]
```

### Parameters

- **target**: File, directory, or test pattern (default: all tests)
- **--mode**: Operation mode
  - `run`: Execute tests (default)
  - `generate`: Generate test code
  - `coverage`: Run with coverage report
  - `failed`: Re-run only failed tests
  - `watch`: Watch mode (continuous)
- **--watch**: Enable watch mode
- **--coverage**: Include coverage report

### Framework Auto-Detection

#### JavaScript/TypeScript
| Indicator | Framework | Command |
|-----------|-----------|---------|
| `jest.config.*` or jest in package.json | Jest | `npm test` or `jest` |
| `vitest.config.*` or vitest in package.json | Vitest | `vitest run` |
| `mocha` in package.json | Mocha | `mocha` |
| `playwright.config.*` | Playwright | `playwright test` |
| `cypress.config.*` | Cypress | `cypress run` |

#### Python
| Indicator | Framework | Command |
|-----------|-----------|---------|
| `pytest.ini`, `pyproject.toml [tool.pytest]` | pytest | `pytest` |
| `tests/` with `test_*.py` | pytest/unittest | `pytest` or `python -m unittest` |

#### Go
| Indicator | Framework | Command |
|-----------|-----------|---------|
| `*_test.go` files | go test | `go test ./...` |

#### Rust
| Indicator | Framework | Command |
|-----------|-----------|---------|
| `#[test]` in files or `tests/` dir | cargo test | `cargo test` |

### Mode: Run (--mode=run)

Execute tests and report results.

**Output Format**:
```
## Test Results

**Framework**: [detected framework]
**Command**: `[executed command]`
**Duration**: [time]

---

### Summary

✅ **Passed**: 45
❌ **Failed**: 2
⏭️ **Skipped**: 1

---

### Failed Tests

#### ❌ [test file] › [test suite] › [test name]

**Location**: `src/utils.test.ts:45`

**Error**:
```
Expected: "hello"
Received: "Hello"
```

**Code**:
```typescript
expect(greet('world')).toBe('hello');
```

**Suggestion**: The `greet` function returns capitalized string. Update test expectation or function implementation.

---

#### ❌ [next failed test...]

---

### Passed Tests (collapsed)

<details>
<summary>45 passed tests</summary>

- ✅ src/api.test.ts › fetchUser › returns user data
- ✅ src/api.test.ts › fetchUser › handles 404
- ...
</details>
```

### Mode: Coverage (--mode=coverage)

Run tests with coverage analysis.

**Output Format**:
```
## Coverage Report

**Overall**: 78.5%

| Metric | Covered | Total | Percentage |
|--------|---------|-------|------------|
| Statements | 156 | 200 | 78.0% |
| Branches | 52 | 80 | 65.0% |
| Functions | 41 | 50 | 82.0% |
| Lines | 158 | 200 | 79.0% |

---

### Uncovered Files

| File | Lines | Uncovered Lines |
|------|-------|-----------------|
| src/utils/legacy.ts | 0% | 1-50 (all) |
| src/api/deprecated.ts | 23% | 15-20, 45-60 |
| src/components/Modal.tsx | 45% | 30-35, 78-90 |

---

### Recommendations

1. **High Impact**: Add tests for `src/api/users.ts` - used by 12 components
2. **Quick Win**: `src/utils/format.ts` needs 2 more tests for 100%
3. **Consider Removal**: `src/utils/legacy.ts` has 0% coverage - is it used?
```

### Mode: Generate (--mode=generate)

Generate test code for a file or function.

**Process**:
1. Analyze existing test patterns in project
2. Read the target file/function
3. Identify test cases:
   - Happy path (normal operation)
   - Edge cases (boundary values, empty inputs)
   - Error cases (invalid inputs, exceptions)
4. Generate test code following project conventions

**Output Format**:
```
## Generated Tests: [target]

**File**: `src/utils/format.test.ts` (new)
**Framework**: Jest
**Test Cases**: 6

---

### Preview

```typescript
import { formatDate, formatCurrency } from './format';

describe('formatDate', () => {
  it('should format date in default locale', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('January 15, 2024');
  });

  it('should handle invalid date', () => {
    expect(formatDate(null)).toBe('Invalid Date');
  });

  it('should format with custom locale', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date, 'ko-KR')).toBe('2024년 1월 15일');
  });
});

describe('formatCurrency', () => {
  it('should format USD by default', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should handle negative values', () => {
    expect(formatCurrency(-100)).toBe('-$100.00');
  });
});
```

---

### Actions

- [Write File]: Create the test file
- [Modify]: Edit the generated tests
- [Add More]: Generate additional test cases
```

### Domain-Specific Test Patterns

#### Frontend (React/Vue/Svelte)
- Component rendering tests
- User interaction tests (click, input)
- Snapshot tests
- Hook tests
- Integration with Testing Library

#### Backend
- API endpoint tests
- Database integration tests
- Authentication/Authorization tests
- Middleware tests

#### Mobile
- Screen rendering tests
- Navigation tests
- Native module mocks

#### Data/ML
- Data validation tests
- Model accuracy tests
- Pipeline tests

### Error Handling

**No test framework**:
```
## Error: NO_FRAMEWORK

No test framework detected.

### Solution
1. Install a test framework:
   - JavaScript: `npm install -D jest` or `npm install -D vitest`
   - Python: `pip install pytest`

2. Create config file (optional):
   - `jest.config.js` for Jest
   - `vitest.config.ts` for Vitest
   - `pytest.ini` for pytest

3. Run `/test` again
```

**Tests not found**:
```
## Error: NO_TESTS

No test files found matching pattern.

### Solution
1. Check test file naming convention:
   - Jest/Vitest: `*.test.ts`, `*.spec.ts`
   - pytest: `test_*.py`, `*_test.py`

2. Run `/test --mode=generate [file]` to create tests
```

## Examples

**Run all tests**:
```
/test
```

**Run specific file**:
```
/test src/utils/format.test.ts
```

**Generate tests for a file**:
```
/test src/utils/format.ts --mode=generate
```

**Run with coverage**:
```
/test --coverage
```

**Watch mode**:
```
/test --watch
```

**Run only failed tests**:
```
/test --mode=failed
```

## Notes

- Detected framework is cached after `/init`
- Generated tests follow existing project patterns
- Coverage thresholds from config are respected
- Use with `/tdd` for test-driven development workflow
