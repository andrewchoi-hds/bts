# /doc - Documentation Generator

Generate and update documentation for code, APIs, and components.

## Instructions

You are the **Documenter Agent**. Create clear, consistent documentation following project conventions.

### Usage

```
/doc [target] [--type=TYPE] [--update] [--format=FORMAT]
```

### Parameters

- **target**: File, directory, or function name (default: current directory)
- **--type**: Documentation type to generate
  - `api`: API endpoint documentation (OpenAPI/Swagger style)
  - `readme`: README.md generation/update
  - `inline`: JSDoc/docstring/comments
  - `changelog`: CHANGELOG entry
  - `storybook`: Storybook stories (Frontend)
  - `schema`: Database schema documentation
- **--update**: Update existing docs (don't create new)
- **--format**: Output format
  - `md`: Markdown (default)
  - `json`: JSON (for API docs)
  - `html`: HTML

### Documentation Types

#### 1. API Documentation (--type=api)

Generate OpenAPI-style documentation for API endpoints.

**Output**:
```markdown
# API Documentation

## Base URL
`https://api.example.com/v1`

---

## Authentication

All endpoints require Bearer token authentication.

```http
Authorization: Bearer <token>
```

---

## Endpoints

### Users

#### GET /users

Retrieve a list of users.

**Parameters**:

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| page | integer | query | No | Page number (default: 1) |
| limit | integer | query | No | Items per page (default: 20, max: 100) |
| search | string | query | No | Search by name or email |

**Response**:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

**Status Codes**:

| Code | Description |
|------|-------------|
| 200 | Success |
| 401 | Unauthorized |
| 500 | Server Error |

---

#### POST /users

Create a new user.

**Request Body**:

```json
{
  "name": "string (required)",
  "email": "string (required, email format)",
  "password": "string (required, min 8 chars)"
}
```

**Response**: `201 Created`

```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:00:00Z"
}
```
```

---

#### 2. README Generation (--type=readme)

Generate or update project README.

**Template**:
```markdown
# Project Name

Brief description of the project.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

```bash
npm install
# or
yarn install
```

## Usage

```typescript
import { something } from 'project-name';

// Example usage
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | API endpoint | `http://localhost:3000` |

## Development

```bash
# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## API Reference

[Link to API docs or brief overview]

## Contributing

[Contributing guidelines]

## License

[License type]
```

---

#### 3. Inline Documentation (--type=inline)

Add JSDoc, docstrings, or comments to code.

**JavaScript/TypeScript (JSDoc)**:
```typescript
/**
 * Formats a date according to the specified locale.
 *
 * @param date - The date to format
 * @param locale - The locale string (default: 'en-US')
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 *
 * @example
 * ```ts
 * formatDate(new Date('2024-01-15')); // "January 15, 2024"
 * formatDate(new Date('2024-01-15'), 'ko-KR'); // "2024년 1월 15일"
 * ```
 *
 * @throws {TypeError} If date is not a valid Date object
 */
export function formatDate(
  date: Date,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string {
  // implementation
}
```

**Python (docstring)**:
```python
def format_date(date: datetime, locale: str = 'en-US') -> str:
    """
    Format a date according to the specified locale.

    Args:
        date: The date to format
        locale: The locale string (default: 'en-US')

    Returns:
        Formatted date string

    Raises:
        TypeError: If date is not a valid datetime object

    Example:
        >>> format_date(datetime(2024, 1, 15))
        'January 15, 2024'
    """
    # implementation
```

**Go**:
```go
// FormatDate formats a date according to the specified layout.
//
// Parameters:
//   - date: The time to format
//   - layout: The layout string (default: "January 2, 2006")
//
// Returns:
//   - Formatted date string
//
// Example:
//
//	FormatDate(time.Now(), "2006-01-02") // "2024-01-15"
func FormatDate(date time.Time, layout string) string {
    // implementation
}
```

---

#### 4. CHANGELOG Entry (--type=changelog)

Generate changelog entries following Keep a Changelog format.

**Output**:
```markdown
## [1.2.0] - 2024-01-15

### Added
- New user authentication flow with OAuth support
- Rate limiting middleware for API endpoints
- Dark mode toggle in settings

### Changed
- Updated dependencies to latest versions
- Improved error messages for validation failures
- Refactored database queries for better performance

### Fixed
- Fixed memory leak in WebSocket connections
- Corrected timezone handling in date formatter
- Resolved race condition in cache invalidation

### Security
- Patched XSS vulnerability in user input fields
- Updated JWT library to address CVE-2024-XXXX

### Deprecated
- Legacy authentication endpoint `/api/auth/legacy`

### Removed
- Dropped support for Node.js 16
```

---

#### 5. Storybook Stories (--type=storybook)

Generate Storybook stories for components.

**Output**:
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled Button',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
```

---

#### 6. Schema Documentation (--type=schema)

Document database schema.

**Output**:
```markdown
# Database Schema

## Tables

### users

User accounts and profiles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| email | VARCHAR(255) | No | - | Unique email address |
| name | VARCHAR(100) | No | - | Display name |
| password_hash | VARCHAR(255) | No | - | Bcrypt hashed password |
| role | ENUM | No | 'user' | User role (user, admin) |
| created_at | TIMESTAMP | No | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | No | NOW() | Last update timestamp |

**Indexes**:
- `users_pkey` - PRIMARY KEY (id)
- `users_email_key` - UNIQUE (email)
- `users_created_at_idx` - INDEX (created_at)

**Relations**:
- Has many `posts`
- Has many `comments`

---

### posts

Blog posts created by users.

[Similar structure...]
```

### Documentation Principles

1. **Clarity**: Write for someone unfamiliar with the code
2. **Completeness**: Cover all public APIs
3. **Examples**: Include practical usage examples
4. **Accuracy**: Keep docs in sync with code
5. **Consistency**: Follow existing project style

### Output Actions

After generating documentation:

```
## Documentation Generated

### Files Created/Updated

| File | Action | Lines |
|------|--------|-------|
| docs/api/users.md | Created | 150 |
| src/utils/format.ts | Updated (inline) | +25 |
| README.md | Updated | +30 |

### Preview

[Preview of generated content]

### Actions

- [Write All]: Apply all changes
- [Write Selected]: Choose which to apply
- [Edit]: Modify before writing
- [Cancel]: Discard changes
```

### Error Handling

**No target found**:
```
## Error: NO_TARGET

No documentable code found at: [target]

### Solution
1. Specify a file: `/doc src/utils/format.ts`
2. Specify a directory: `/doc src/components`
3. Check path exists: `/map`
```

**Already documented (without --update)**:
```
## Warning: ALREADY_DOCUMENTED

Documentation already exists for: [target]

### Options
1. Update existing: `/doc [target] --update`
2. View current: [link to docs]
3. Override: Confirm to replace
```

## Examples

**Generate API docs**:
```
/doc src/routes --type=api
```

**Generate/update README**:
```
/doc --type=readme
```

**Add inline docs to file**:
```
/doc src/utils/format.ts --type=inline
```

**Generate changelog entry**:
```
/doc --type=changelog
```

**Create Storybook stories**:
```
/doc src/components/Button.tsx --type=storybook
```

**Update existing docs**:
```
/doc src/api --type=api --update
```

## Notes

- Follows existing project documentation style
- Preserves manually written documentation
- Works with `/review` to check documentation coverage
- Run after implementing new features
- Consider running `/doc --type=changelog` before releases
