# /review - Code Review

Review code changes, PRs, and staged files for issues and improvements.

## Instructions

You are the **Reviewer Agent** combined with the detected **Domain Agent**. Perform thorough code review.

### Usage

```
/review [target] [--checklist] [--strict]
```

### Target Options

| Target | Description | Command Used |
|--------|-------------|--------------|
| (none) | Recent changes vs HEAD | `git diff HEAD` |
| `staged` | Staged changes only | `git diff --staged` |
| `PR#123` | GitHub PR by number | `gh pr view 123 --json` |
| `branch-name` | Compare branch to main | `git diff main...branch` |
| `file/path.ts` | Review specific file | Direct file read |
| `commit-hash` | Review specific commit | `git show hash` |

### Options

- `--checklist`: Output as actionable checklist
- `--strict`: Apply stricter standards (for critical code)

### Review Criteria

#### 1. Correctness
- Logic errors and bugs
- Off-by-one errors
- Null/undefined handling
- Race conditions
- Edge cases not handled

#### 2. Security
- Input validation
- Authentication/Authorization
- Sensitive data exposure
- Injection vulnerabilities
- CSRF/XSS risks

#### 3. Performance
- Unnecessary computations
- N+1 queries
- Memory leaks
- Missing memoization
- Large bundle imports

#### 4. Code Quality
- Naming clarity
- Function length (>50 lines)
- Cyclomatic complexity
- Code duplication
- Dead code

#### 5. Testing
- Test coverage for changes
- Missing edge case tests
- Test quality
- Mocking appropriateness

#### 6. Documentation
- Public API documentation
- Complex logic comments
- README updates needed
- Breaking change notes

### Domain-Specific Criteria

#### Frontend
- Component composition
- State management patterns
- Accessibility (a11y)
- Responsive design
- Performance (renders, bundle size)

#### Backend
- API design (REST/GraphQL conventions)
- Database query efficiency
- Error handling consistency
- Transaction boundaries
- Rate limiting

#### Mobile
- Platform guidelines compliance
- Memory management
- Battery efficiency
- Offline handling

#### Data/ML
- Data leakage prevention
- Reproducibility
- Model versioning
- Bias considerations

### Output Format

```
## Code Review: [target]

**Reviewer**: Claude (Reviewer + [Domain] Agent)
**Files Changed**: [count]
**Lines**: +[added] / -[removed]
**Risk Level**: [Low | Medium | High | Critical]

---

### Summary

[2-3 sentence overview of the changes and overall assessment]

---

### Issues Found

#### 🔴 Critical (N)

##### [Issue Title]
📍 `file/path.ts:45-52`

**Code**:
```typescript
// Current problematic code
const data = await fetch(url);
return data; // Missing error handling
```

**Problem**: No error handling for failed requests. Will throw unhandled exception.

**Suggested Fix**:
```typescript
try {
  const data = await fetch(url);
  return data;
} catch (error) {
  logger.error('Fetch failed', { url, error });
  throw new FetchError('Failed to retrieve data', { cause: error });
}
```

---

#### 🟠 High (N)

[Same format]

---

#### 🟡 Medium (N)

[Same format]

---

#### 🟢 Low (N)

[Same format]

---

### Positive Highlights ✨

- Good use of TypeScript generics in `utils/types.ts`
- Comprehensive error messages
- Clean separation of concerns

---

### Recommendations

1. **Must Fix** (before merge):
   - [ ] Add error handling to API calls
   - [ ] Fix SQL injection vulnerability

2. **Should Fix** (strongly recommended):
   - [ ] Add tests for new validation logic
   - [ ] Update API documentation

3. **Consider** (nice to have):
   - [ ] Extract repeated logic to utility
   - [ ] Add JSDoc comments

---

### Test Coverage Impact

| File | Before | After | Delta |
|------|--------|-------|-------|
| src/api/users.ts | 85% | 72% | -13% ⚠️ |
| src/utils/validate.ts | 0% | 0% | new file |

**Recommendation**: Add tests for new code before merging.

---

### Checklist (--checklist mode)

- [x] No obvious bugs
- [x] No security vulnerabilities
- [ ] Error handling complete
- [x] Naming is clear
- [ ] Tests included
- [ ] Documentation updated
```

### Risk Level Assessment

| Level | Criteria |
|-------|----------|
| **Critical** | Security vulnerability, data loss risk, breaking change |
| **High** | Bugs likely to occur, missing error handling, no tests |
| **Medium** | Code smells, minor issues, improvement opportunities |
| **Low** | Style issues, minor optimizations, suggestions |

### PR Review Integration

When reviewing a GitHub PR (`/review PR#123`):

1. Fetch PR metadata via `gh pr view`
2. Get diff via `gh pr diff`
3. Check existing comments
4. Review CI status
5. Consider PR description/context

**Additional PR Output**:
```
### PR Information

**Title**: [PR title]
**Author**: @[username]
**Branch**: [branch] → [base]
**CI Status**: ✅ Passing | ❌ Failing | 🔄 Running

### Existing Comments

[Summary of existing review comments if any]

### Related Issues

- Closes #123
- Related to #456
```

### Strict Mode (--strict)

Additional checks applied:
- No `any` types allowed (TypeScript)
- 100% test coverage for new code required
- All functions must have JSDoc/docstring
- No TODO comments in production code
- No console.log/print statements
- All errors must be typed

### Error Handling

**Not a git repository**:
```
## Error: NOT_GIT_REPO

This directory is not a Git repository.

### Solution
1. Navigate to a Git repository
2. Initialize with `git init`
3. Review files directly: `/review path/to/file.ts`
```

**PR not found**:
```
## Error: PR_NOT_FOUND

PR #[number] not found.

### Solution
1. Verify PR number exists: `gh pr list`
2. Check repository: `gh repo view`
3. Authenticate: `gh auth login`
```

**No changes**:
```
## No Changes to Review

Working directory is clean with no staged or unstaged changes.

### Options
1. Make some changes and run `/review` again
2. Review specific file: `/review src/file.ts`
3. Review a PR: `/review PR#123`
```

## Examples

**Review current changes**:
```
/review
```

**Review staged files only**:
```
/review staged
```

**Review a GitHub PR**:
```
/review PR#42
```

**Review with strict mode**:
```
/review staged --strict
```

**Review specific file**:
```
/review src/components/Auth.tsx
```

**Review branch comparison**:
```
/review feature/auth
```

**Get checklist output**:
```
/review --checklist
```

## Notes

- Run `/init` first for domain-specific review criteria
- Combines with `/analyze` for deeper code analysis
- Reviews are based on visible changes + relevant context
- Consider running `/test` after addressing review feedback
- Export review with copy-paste for PR comments
