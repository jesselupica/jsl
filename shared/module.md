# Shared Utilities Module

## Purpose

The `shared/` directory contains utilities, types, and helper functions used by both the JSL client and server. This promotes code reuse and ensures consistency across the codebase.

## Key Files

### ejeca.ts
Enhanced wrapper around Node.js `child_process` for executing commands.

**Features:**
- Promise-based API
- Stream handling
- Better error messages
- Cancellation support via AbortSignal

**Usage:**
```typescript
import {ejeca} from 'shared/ejeca';

const result = await ejeca('git', ['status'], {cwd: '/repo'});
console.log(result.stdout);
```

### utils.ts
General utility functions:
- `notEmpty(value)`: Type guard for filtering nulls
- `nullthrows(value)`: Assert non-null
- `randomId()`: Generate unique IDs
- String manipulation helpers

### TypedEventEmitter.ts
Type-safe event emitter for internal communication.

**Usage:**
```typescript
type Events = {
  'data': (value: number) => void;
  'error': (err: Error) => void;
};

const emitter = new TypedEventEmitter<Events>();
emitter.on('data', (value) => console.log(value));
emitter.emit('data', 42);
```

### Comparison.ts
Types and utilities for diff comparisons:
- HEAD vs working copy
- Commit vs parent
- Custom ranges

### LRU.ts
Least Recently Used cache implementation for performance optimization.

### RateLimiter.ts
Prevents too many operations from running simultaneously.

### debounce.ts
Debounce utility for delaying function execution until calls stop.

### pathUtils.ts
Path manipulation helpers:
- Relative path computation
- Path normalization
- Platform-specific handling

### diff.ts
Diff computation utilities:
- Line-by-line diffs
- Word-level diffs
- Intraline highlighting

### fs.ts
File system helpers:
- `exists(path)`: Check if file exists
- Promisified fs operations

### ContextMenu.tsx
Reusable context menu component used across the UI.

### SplitDiffView/
Components for side-by-side diff visualization.

### textmate-lib/
TextMate grammar integration for syntax highlighting in diffs.

## Type Definitions

### types/
Shared TypeScript types:
- Platform types
- Configuration types
- Common interfaces

## Testing Utilities

### testUtils.ts
Helpers for writing tests:
- Mock data generators
- Test setup functions
- Assertion helpers

## Dependencies

Shared module has minimal dependencies:
- No React (to keep server-side usage clean)
- Only Node.js built-ins and small utilities
- Compatible with both browser and Node.js

## Usage Patterns

### In Server Code
```typescript
import {ejeca} from 'shared/ejeca';
import {TypedEventEmitter} from 'shared/TypedEventEmitter';
import {LRU} from 'shared/LRU';

// Execute commands
const result = await ejeca('git', ['log']);

// Cache results
const cache = new LRU<string, CommitInfo>(100);
```

### In Client Code
```typescript
import {debounce} from 'shared/debounce';
import {ContextMenu} from 'shared/ContextMenu';

// Debounce user input
const handleSearch = debounce((query) => {
  performSearch(query);
}, 300);
```

## Contributing

When adding to shared:
1. Ensure it's truly needed by both client and server
2. Keep dependencies minimal
3. Add tests for any complex logic
4. Document exports clearly
5. Consider platform compatibility (browser vs Node.js)

