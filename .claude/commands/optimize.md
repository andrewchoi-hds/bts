# /optimize - Optimization Analysis

Analyze and optimize token usage, code performance, and bundle size.

## Instructions

You are analyzing optimization opportunities. Focus on actionable, high-impact improvements.

### Usage

```
/optimize [--type=TYPE] [target]
```

### Parameters

- **--type**: Optimization type
  - `token`: Claude token usage optimization (default)
  - `perf`: Code performance optimization
  - `bundle`: Bundle size optimization (Frontend)
  - `query`: Database query optimization (Backend)
  - `memory`: Memory usage optimization
- **target**: File or directory to analyze (default: current session/project)

### Type: Token Optimization (default)

Analyze and optimize Claude Code token usage.

```
/optimize --type=token
```

**Output**:
```
## Token Optimization Analysis

### Current Session Stats
| Metric | Value |
|--------|-------|
| Total Tokens | ~18,500 |
| Input Tokens | ~15,000 |
| Output Tokens | ~3,500 |
| Files Read | 23 |
| Search Operations | 8 |

---

### Optimization Opportunities

#### 1. 🔴 High Impact: Redundant File Reads

**Issue**: Same files read multiple times
```
src/utils/format.ts - read 3 times
src/components/Button.tsx - read 2 times
```

**Savings**: ~2,000 tokens

**Solution**: Reference previous reads or ask for specific sections
```
Instead of: "Read src/utils/format.ts"
Use: "In format.ts that we read earlier, the formatDate function..."
```

---

#### 2. 🟠 Medium Impact: Full File Reads

**Issue**: Reading entire large files when only parts needed
```
src/api/handlers.ts (850 lines) - full read
src/types/index.ts (420 lines) - full read
```

**Savings**: ~1,500 tokens

**Solution**: Use targeted reads
```
Instead of: Read entire file
Use: "Read lines 50-100 of src/api/handlers.ts"
Or: "Search for 'function handleAuth' in handlers.ts"
```

---

#### 3. 🟡 Medium Impact: Broad Searches

**Issue**: Searching entire codebase when scope is known
```
Grep "useState" in all files - 45 matches
Grep "interface User" in all files - 12 matches
```

**Savings**: ~800 tokens

**Solution**: Narrow search scope
```
Instead of: Grep "useState" (all files)
Use: Grep "useState" in src/hooks/ --type=ts
```

---

#### 4. 🟢 Low Impact: Exploration Without Caching

**Issue**: Re-exploring known structure
```
/map called 2 times on same directory
ls commands on same paths
```

**Savings**: ~400 tokens

**Solution**: Reference earlier exploration
```
"Based on the /map output earlier, the components are in..."
```

---

### Summary

| Category | Current | Optimized | Savings |
|----------|---------|-----------|---------|
| File Reads | 8,000 | 5,500 | 2,500 |
| Searches | 3,000 | 2,000 | 1,000 |
| Exploration | 2,000 | 1,500 | 500 |
| **Total** | **18,500** | **14,500** | **4,000 (22%)** |

---

### Recommendations

1. **Use Explore Agent** for codebase exploration
   ```
   Instead of multiple Glob/Grep calls, use Task with Explore agent
   ```

2. **Cache /init and /map results** mentally
   ```
   Reference "as we saw in /init" instead of re-running
   ```

3. **Be specific in requests**
   ```
   "Read the handleAuth function" vs "Read the auth file"
   ```

4. **Batch related questions**
   ```
   Ask about multiple related items in one message
   ```
```

### Type: Performance Optimization

Analyze code for performance issues.

```
/optimize --type=perf src/
```

**Output**:
```
## Performance Analysis: src/

### Critical Issues

#### 1. N+1 Query Pattern
📍 `src/api/posts.ts:45-52`

```typescript
// Current: N+1 queries
const posts = await db.posts.findMany();
for (const post of posts) {
  post.author = await db.users.findById(post.authorId); // N queries!
}
```

**Impact**: 100 posts = 101 database queries
**Fix**:
```typescript
const posts = await db.posts.findMany({
  include: { author: true }
});
```

---

#### 2. Missing Memoization
📍 `src/components/Dashboard.tsx:23`

```typescript
// Current: Recalculates on every render
const expensiveData = processLargeDataset(data);
```

**Impact**: Blocks render, ~200ms per render
**Fix**:
```typescript
const expensiveData = useMemo(
  () => processLargeDataset(data),
  [data]
);
```

---

### High Priority

#### 3. Synchronous File Operations
📍 `src/utils/files.ts:12`

```typescript
// Current: Blocks event loop
const content = fs.readFileSync(path, 'utf-8');
```

**Impact**: Blocks all requests during read
**Fix**:
```typescript
const content = await fs.promises.readFile(path, 'utf-8');
```

---

#### 4. Unoptimized Loop
📍 `src/utils/transform.ts:67`

```typescript
// Current: O(n²) complexity
items.forEach(item => {
  const match = otherItems.find(o => o.id === item.refId);
});
```

**Impact**: 1000 items = 1,000,000 operations
**Fix**:
```typescript
const otherMap = new Map(otherItems.map(o => [o.id, o]));
items.forEach(item => {
  const match = otherMap.get(item.refId); // O(1) lookup
});
```

---

### Summary

| Priority | Issues | Est. Impact |
|----------|--------|-------------|
| Critical | 2 | 80% improvement |
| High | 3 | 15% improvement |
| Medium | 5 | 4% improvement |
| Low | 8 | 1% improvement |

### Quick Wins (< 5 min each)
1. [ ] Add useMemo to Dashboard.tsx
2. [ ] Convert sync file ops to async
3. [ ] Add index to posts.authorId column
```

### Type: Bundle Optimization

Analyze frontend bundle size.

```
/optimize --type=bundle
```

**Output**:
```
## Bundle Analysis

### Overview
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Total Size | 1.8 MB | < 1 MB | ⚠️ Over |
| Gzipped | 520 KB | < 250 KB | ⚠️ Over |
| Initial JS | 890 KB | < 200 KB | ❌ Critical |

---

### Largest Dependencies

| Package | Size | % of Bundle |
|---------|------|-------------|
| moment | 290 KB | 16% |
| lodash | 180 KB | 10% |
| @mui/material | 320 KB | 18% |
| chart.js | 210 KB | 12% |

---

### Optimization Opportunities

#### 1. 🔴 Replace moment.js
**Current**: 290 KB
**Alternative**: date-fns (tree-shakeable) ~20 KB used

```typescript
// Before
import moment from 'moment';
moment(date).format('YYYY-MM-DD');

// After
import { format } from 'date-fns';
format(date, 'yyyy-MM-dd');
```
**Savings**: ~270 KB

---

#### 2. 🔴 Tree-shake lodash
**Current**: 180 KB (entire library)
**Used functions**: debounce, groupBy, merge

```typescript
// Before
import _ from 'lodash';
_.debounce(fn, 300);

// After
import debounce from 'lodash/debounce';
// Or use lodash-es
import { debounce } from 'lodash-es';
```
**Savings**: ~160 KB

---

#### 3. 🟠 Dynamic import for charts
**Current**: Loaded on initial page
**Usage**: Only on Dashboard page

```typescript
// Before
import { Chart } from 'chart.js';

// After
const Chart = dynamic(() => import('chart.js'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
```
**Savings**: 210 KB from initial bundle

---

#### 4. 🟡 Code splitting by route
```typescript
// Next.js - automatic with pages/
// React Router - manual
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
```

---

### Projected Results

| Metric | Current | After | Improvement |
|--------|---------|-------|-------------|
| Total | 1.8 MB | 980 KB | -46% |
| Gzipped | 520 KB | 240 KB | -54% |
| Initial | 890 KB | 180 KB | -80% |

### Commands

**Analyze with source-map-explorer**:
```bash
npm run build
npx source-map-explorer 'dist/**/*.js'
```

**Analyze with webpack-bundle-analyzer**:
```bash
ANALYZE=true npm run build
```
```

### Type: Query Optimization

Analyze database queries.

```
/optimize --type=query src/api/
```

**Output**:
```
## Query Optimization Analysis

### Slow Queries Detected

#### 1. Missing Index
📍 `src/api/users.ts:34`

```sql
SELECT * FROM users WHERE email = ?
```

**Issue**: Full table scan (no index on email)
**Impact**: ~500ms for 100k rows

**Fix**:
```sql
CREATE INDEX idx_users_email ON users(email);
```

---

#### 2. SELECT *
📍 `src/api/posts.ts:56`

```typescript
const posts = await db.query('SELECT * FROM posts WHERE user_id = ?');
```

**Issue**: Fetches all 20 columns, only 3 used
**Impact**: 5x more data transferred

**Fix**:
```typescript
const posts = await db.query(
  'SELECT id, title, created_at FROM posts WHERE user_id = ?'
);
```

---

#### 3. N+1 in Loop
📍 `src/api/reports.ts:78-85`

```typescript
for (const order of orders) {
  order.items = await db.orderItems.findMany({
    where: { orderId: order.id }
  });
}
```

**Impact**: 100 orders = 101 queries

**Fix**:
```typescript
const orders = await db.orders.findMany({
  include: { items: true }
});
```

---

### Index Recommendations

| Table | Column(s) | Query Pattern | Priority |
|-------|-----------|---------------|----------|
| users | email | WHERE email = | High |
| posts | user_id, created_at | WHERE + ORDER BY | High |
| orders | status, created_at | WHERE + ORDER BY | Medium |

### Summary

| Issue Type | Count | Est. Impact |
|------------|-------|-------------|
| Missing Index | 3 | 70% faster |
| N+1 Queries | 2 | 90% fewer queries |
| Over-fetching | 5 | 50% less data |
```

### Error Handling

**No analysis target**:
```
## Token Optimization

Analyzing current session...

No significant optimization opportunities detected.
Token usage is efficient.

### Tips for Staying Efficient
1. Use specific file paths instead of broad searches
2. Reference earlier context instead of re-reading
3. Use Explore agent for multi-file investigations
```

## Examples

**Token optimization**:
```
/optimize
```

**Performance analysis**:
```
/optimize --type=perf src/api/
```

**Bundle analysis**:
```
/optimize --type=bundle
```

**Query optimization**:
```
/optimize --type=query
```

**Memory analysis**:
```
/optimize --type=memory src/services/
```

## Notes

- Token optimization is unique to Claude Code sessions
- Performance analysis requires reading source code
- Bundle analysis may require build artifacts
- Query optimization works with ORM patterns and raw SQL
- Results are actionable with specific code suggestions
