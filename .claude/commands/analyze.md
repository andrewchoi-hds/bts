# /analyze - Code Analysis

Perform comprehensive code quality and security analysis.

## Instructions

You are the **Reviewer Agent** combined with the detected **Domain Agent**. Analyze code for issues and improvements.

### Usage

```
/analyze [target] [--type=TYPE] [--severity=LEVEL]
```

### Parameters

- **target**: File or directory to analyze (default: current directory)
- **--type**: Analysis type
  - `security`: Security vulnerabilities (OWASP Top 10)
  - `quality`: Code quality (complexity, duplication, style)
  - `perf`: Performance issues
  - `all`: Complete analysis (default)
- **--severity**: Minimum severity to report
  - `critical`: Only critical issues
  - `high`: Critical + High
  - `medium`: Critical + High + Medium (default)
  - `low`: All issues

### Analysis Categories

#### 1. Security (OWASP Top 10)

Check for:
- **Injection**: SQL, NoSQL, OS command, LDAP injection
- **Broken Auth**: Weak passwords, session issues, credential exposure
- **Sensitive Data**: Hardcoded secrets, unencrypted data, PII exposure
- **XXE**: XML external entity vulnerabilities
- **Broken Access**: Missing authorization checks, IDOR
- **Misconfig**: Debug mode, default credentials, verbose errors
- **XSS**: Cross-site scripting vulnerabilities
- **Insecure Deserialization**: Unsafe object deserialization
- **Vulnerable Components**: Known CVEs in dependencies
- **Logging Failures**: Missing audit logs, log injection

#### 2. Code Quality

Check for:
- **Complexity**: High cyclomatic complexity (>10)
- **Duplication**: Repeated code blocks
- **Dead Code**: Unused variables, unreachable code
- **Naming**: Poor or inconsistent naming conventions
- **Comments**: Missing docs for public APIs, outdated comments
- **Error Handling**: Missing try-catch, unhandled promises
- **Type Safety**: Any types, missing null checks (TypeScript)

#### 3. Performance

Check for:
- **Memory Leaks**: Event listeners not removed, circular refs
- **N+1 Queries**: Database query in loops
- **Blocking Operations**: Sync I/O in async context
- **Unnecessary Renders**: Missing memoization (React)
- **Bundle Size**: Large imports, missing tree-shaking
- **Caching**: Missing or ineffective caching

### Domain-Specific Analysis

#### Frontend
- Component re-render issues
- Accessibility (a11y) violations
- Bundle size impact
- State management anti-patterns
- Missing error boundaries

#### Backend
- N+1 query patterns
- Missing rate limiting
- Unvalidated inputs
- Connection pool issues
- Missing transactions

#### Mobile
- Memory leaks
- Battery drain patterns
- Large asset loading
- Thread blocking

#### Data/ML
- Data leakage between train/test
- Missing input validation
- Model bias indicators
- Resource-intensive operations

### Output Format

```
## Analysis Report: [target]

**Scanned**: [file count] files
**Domain**: [detected domain]
**Analysis Type**: [type]

---

### Critical (N issues)

#### [CATEGORY] Issue Title
📍 `file/path.ts:LINE`

**Code**:
```language
// problematic code snippet
```

**Problem**: [explanation]

**Fix**:
```language
// suggested fix
```

---

### High (N issues)

[Same format]

---

### Medium (N issues)

[Same format]

---

### Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 1 | 2 | 0 | 1 |
| Quality | 0 | 3 | 5 | 2 |
| Performance | 0 | 1 | 2 | 0 |
| **Total** | **1** | **6** | **7** | **3** |

### Recommendations

1. [Priority 1 action]
2. [Priority 2 action]
3. [Priority 3 action]
```

### Severity Definitions

| Level | Definition | Action |
|-------|------------|--------|
| **Critical** | Security vulnerability or crash | Fix immediately |
| **High** | Significant bug or security risk | Fix before merge |
| **Medium** | Code smell or minor issue | Fix when possible |
| **Low** | Style or optimization | Consider fixing |

### Token Optimization

1. **Sampling**: For large directories, analyze key files first
2. **Incremental**: Focus on changed files when possible
3. **Summary**: Group similar issues together
4. **Skip generated**: Ignore auto-generated files

### Error Handling

**Target not found**:
```
## Error: NOT_FOUND

Cannot find: [target]

### Solution
1. Check the path exists
2. Use `/map` to see available files
```

**Binary file**:
```
## Error: UNSUPPORTED

Cannot analyze binary file: [filename]
Binary files are not supported for code analysis.
```

**Too large**:
```
## Warning: LARGE_TARGET

Target contains [N] files. Analyzing top [M] by importance.
For full analysis, specify individual directories.
```

## Examples

**Analyze current directory**:
```
/analyze
```

**Security audit of specific file**:
```
/analyze src/api/auth.ts --type=security
```

**Quality check with all severities**:
```
/analyze src/components --type=quality --severity=low
```

**Performance analysis**:
```
/analyze src/hooks --type=perf
```

## Notes

- Use with `/init` first for domain-specific analysis
- Results are prioritized by severity and fix effort
- Suggested fixes follow project's existing patterns
- Run before PR to catch issues early
