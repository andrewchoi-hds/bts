# /tdd - Test-Driven Development

Guide through the TDD (Red-Green-Refactor) workflow.

## Instructions

You are the **Tester Agent** combined with the detected **Domain Agent**. Facilitate TDD workflow.

### Usage

```
/tdd [feature-name] [--spec=FILE]
```

### Parameters

- **feature-name**: Name/description of the feature to implement
- **--spec=FILE**: Path to specification file (optional)

### TDD Cycle

```
┌─────────────────────────────────────────────────────────┐
│                    TDD CYCLE                             │
│                                                          │
│    ┌─────────┐      ┌─────────┐      ┌──────────┐      │
│    │   RED   │ ───→ │  GREEN  │ ───→ │ REFACTOR │      │
│    │  Write  │      │  Make   │      │  Clean   │      │
│    │ failing │      │  test   │      │   up     │      │
│    │  test   │      │  pass   │      │  code    │      │
│    └─────────┘      └─────────┘      └──────────┘      │
│         ↑                                   │           │
│         └───────────────────────────────────┘           │
│                     REPEAT                              │
└─────────────────────────────────────────────────────────┘
```

### Workflow Steps

#### Step 1: Define Requirements
```
/tdd "user authentication"

Starting TDD session...

## Feature: User Authentication

### Requirements Analysis
1. What should this feature do?
2. What inputs does it accept?
3. What outputs does it produce?
4. What are the error cases?

### Let's define test cases together:

1. Basic functionality:
   - [ ] User can register with email/password
   - [ ] User can login with valid credentials

2. Validation:
   - [ ] Email must be valid format
   - [ ] Password must be 8+ characters

3. Error handling:
   - [ ] Invalid email returns error
   - [ ] Wrong password returns error
   - [ ] Non-existent user returns error

Shall I proceed with these test cases, or would you like to modify them?
```

#### Step 2: RED - Write Failing Test
```
## TDD Cycle 1/6: User can register

### Phase: 🔴 RED (Write failing test)

I'll write a test that should fail:

```typescript
// src/auth/auth.test.ts
import { register } from './auth';

describe('register', () => {
  it('should create a new user with email and password', async () => {
    const result = await register({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toMatchObject({
      id: expect.any(String),
      email: 'test@example.com',
    });
    expect(result.password).toBeUndefined(); // Should not expose password
  });
});
```

### Running test to confirm failure...

```
FAIL src/auth/auth.test.ts
  ✗ should create a new user with email and password
    TypeError: register is not a function
```

✅ Test fails as expected (function doesn't exist yet)

Ready for GREEN phase. Should I proceed?
```

#### Step 3: GREEN - Make Test Pass
```
## TDD Cycle 1/6: User can register

### Phase: 🟢 GREEN (Make test pass)

Writing minimum code to pass:

```typescript
// src/auth/auth.ts
interface RegisterInput {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
}

export async function register(input: RegisterInput): Promise<User> {
  // Minimum implementation to pass test
  return {
    id: crypto.randomUUID(),
    email: input.email,
  };
}
```

### Running test...

```
PASS src/auth/auth.test.ts
  ✓ should create a new user with email and password (5ms)
```

✅ Test passes!

Ready for REFACTOR phase. Should I proceed?
```

#### Step 4: REFACTOR - Clean Up
```
## TDD Cycle 1/6: User can register

### Phase: 🔵 REFACTOR (Clean up)

Current code is simple, but let's improve:

1. Add proper types to separate file
2. Add password hashing (security)
3. Prepare for persistence

```typescript
// src/auth/types.ts
export interface RegisterInput {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// src/auth/auth.ts
import { RegisterInput, User } from './types';
import { hashPassword } from './utils';

export async function register(input: RegisterInput): Promise<User> {
  const hashedPassword = await hashPassword(input.password);

  // TODO: Save to database
  const user = {
    id: crypto.randomUUID(),
    email: input.email,
    passwordHash: hashedPassword,
    createdAt: new Date(),
  };

  // Return without sensitive data
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}
```

### Running tests to ensure nothing broke...

```
PASS src/auth/auth.test.ts
  ✓ should create a new user with email and password (5ms)
```

✅ Refactor complete, tests still pass!

---

## Progress: 1/6 test cases complete

| # | Test Case | Status |
|---|-----------|--------|
| 1 | User can register | ✅ Done |
| 2 | User can login | 🔴 Next |
| 3 | Email validation | ⬜ Pending |
| 4 | Password validation | ⬜ Pending |
| 5 | Invalid email error | ⬜ Pending |
| 6 | Wrong password error | ⬜ Pending |

Continue to next test case?
```

### Output Format

```
## TDD Session: [Feature Name]

### Status
- **Phase**: 🔴 RED | 🟢 GREEN | 🔵 REFACTOR
- **Progress**: [current]/[total] test cases
- **Time**: [elapsed]

---

### Current Test Case
**[Test description]**

[Phase-specific content]

---

### Test Cases

| # | Description | Status |
|---|-------------|--------|
| 1 | Basic case | ✅ Done |
| 2 | Edge case | 🔴 Current |
| 3 | Error case | ⬜ Pending |

---

### Files Modified
- `src/auth/auth.ts` (created)
- `src/auth/auth.test.ts` (created)
- `src/auth/types.ts` (created)

---

### Actions
- [Continue]: Move to next phase/test
- [Modify]: Edit current test/code
- [Skip]: Skip this test case
- [Pause]: Save progress and pause
- [Finish]: Complete TDD session
```

### Domain-Specific Patterns

#### Frontend TDD
```typescript
// React component TDD
describe('LoginForm', () => {
  it('should render email and password fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should call onSubmit with credentials', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });
});
```

#### Backend TDD
```typescript
// API endpoint TDD
describe('POST /api/users', () => {
  it('should create user and return 201', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201);

    expect(response.body.data).toMatchObject({
      email: 'test@example.com',
    });
  });

  it('should return 422 for invalid email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'invalid', password: 'password123' })
      .expect(422);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

### TDD Best Practices

```
✅ DO:
- Write ONE test at a time
- Run tests after EVERY change
- Write the SIMPLEST code to pass
- Refactor in small steps
- Keep tests fast and isolated
- Test behavior, not implementation

❌ DON'T:
- Write multiple tests before implementing
- Write production-ready code in GREEN phase
- Skip the REFACTOR phase
- Test implementation details
- Make tests depend on each other
```

### Session Management

TDD sessions are tracked using TodoWrite tool:
- Each test case becomes a todo item
- Progress persists across conversation turns
- Can pause and resume sessions

### Error Handling

**No test framework**:
```
## Error: NO_TEST_FRAMEWORK

No test framework detected.

### Setup Required
1. Install test framework:
   - `npm install -D vitest` or
   - `npm install -D jest`

2. Run `/tdd` again
```

**Session interrupted**:
```
## TDD Session Paused

Progress saved. Resume with:
/tdd --resume

Current state:
- Feature: User Authentication
- Progress: 3/6 tests complete
- Phase: GREEN for test #4
```

## Examples

**Start new TDD session**:
```
/tdd "shopping cart"
```

**With specification file**:
```
/tdd "payment processing" --spec=docs/payment-spec.md
```

**Quick single function**:
```
/tdd "formatCurrency function"
```

## Notes

- Uses TodoWrite to track test cases
- Integrates with `/test` for running tests
- Follows project's existing test patterns
- Domain agent provides specialized patterns
- Can generate test file at end of session
