# JSL Architecture

## System Overview

JSL (Interactive Git SmartLog) is a three-tier web application for visualizing and managing git repositories with a focus on feature branch workflows.

```
┌─────────────────────────────────────────────────────┐
│                   Browser / VSCode                  │
│  ┌───────────────────────────────────────────────┐ │
│  │         JSL Client (React + TypeScript)       │ │
│  │  - Commit graph visualization                 │ │
│  │  - Uncommitted changes view                   │ │
│  │  - Operation triggers                         │ │
│  └────────────────┬──────────────────────────────┘ │
└───────────────────┼──────────────────────────────────┘
                    │
              GraphQL over WebSocket
                    │
┌───────────────────▼──────────────────────────────────┐
│          JSL Server (Node.js + TypeScript)          │
│  ┌───────────────────────────────────────────────┐ │
│  │         Repository Management                  │ │
│  │  - Command translation (Sapling → git)        │ │
│  │  - Operation queueing                         │ │
│  │  - File watching                              │ │
│  │  - Result caching                             │ │
│  └────────────────┬──────────────────────────────┘ │
└───────────────────┼──────────────────────────────────┘
                    │
              Shell Commands
                    │
┌───────────────────▼──────────────────────────────────┐
│              Git + git-branchless                    │
│  - git log, status, commit, checkout, etc.          │
│  - git branchless smartlog, rebase, move            │
│  - Local repository manipulation                    │
└───────────────────────────────────────────────────────┘
```

## Technology Stack

### Client (jsl-client/)
- **React 18**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Jotai**: Atomic state management
- **Vite**: Build tool and dev server
- **StyleX**: CSS-in-JS styling
- **GraphQL**: API communication

### Server (jsl-server/)
- **Node.js**: Runtime
- **TypeScript**: Type safety
- **execa**: Process execution
- **ws**: WebSocket server
- **Watchman** (optional): File watching

### Shared (shared/)
- Common utilities
- Type definitions
- Helper functions

### Components (components/)
- Reusable UI components
- Themed with StyleX
- Platform-agnostic

## Data Flow

### 1. Repository Initialization

```
Client connects → ServerToClientAPI created
                → Repository.getRepoInfo()
                  → git rev-parse --show-toplevel (find root)
                  → git config --list (load config)
                  → Repository instance cached
                → Subscriptions established
                → Initial data fetch
```

### 2. Commit Data Flow

```
Repository.fetchSmartlogCommits()
  → runCommand(['log', ...])
    → GitBranchlessAdapter.translateCommand()
      → Returns: {command: 'git', args: ['branchless', 'smartlog', '--json']}
    → commands.runCommand()
      → ejeca('git', ['branchless', 'smartlog', '--json'])
      → Parse JSON output
      → Transform to ISL format
    → Emit 'smartlogCommits' event
  → ServerToClientAPI broadcasts via GraphQL subscription
    → Client receives update
      → latestCommitsData atom updated
        → CommitTreeList re-renders
```

### 3. Uncommitted Changes Flow

```
Repository.fetchUncommittedChanges()
  → runCommand(['status', '-Tjson'])
    → GitBranchlessAdapter.translateCommand()
      → Returns: {command: 'git', args: ['status', '--porcelain=v2']}
    → Execute and parse output
    → Transform to ISL format
  → Emit 'uncommittedChanges' event
  → Client updates UncommittedChanges component
```

### 4. Operation Execution Flow

```
User clicks "Commit" button
  → Client: operationList.runOperation({args: ['commit', '-m', 'msg']})
    → GraphQL mutation sent to server
      → Repository.runOperation()
        → OperationQueue.queueOperation()
          → When queue ready:
            → GitBranchlessAdapter.translateCommand()
            → Execute git command
            → Stream progress events
            → On completion:
              → Trigger refetch of commits & status
              → Client receives updates
```

## Key Architectural Patterns

### 1. Command Translation Layer

**Problem**: ISL uses Sapling commands, we use git.

**Solution**: GitBranchlessAdapter translates commands:

```typescript
// ISL server code expects to call:
runCommand(['log', '--rev', 'smartlog()'])

// GitBranchlessAdapter intercepts and translates to:
{
  command: 'git',
  args: ['branchless', 'smartlog', '--json'],
  transformOutput: (output) => /* transform to ISL format */
}
```

**Benefits**:
- Minimal changes to ISL server code
- Single point of translation
- Easy to add new commands
- Output transformation in one place

### 2. Repository Caching

**Problem**: Multiple connections to same repository waste resources.

**Solution**: RepositoryCache with reference counting:

```typescript
// Connection 1
const repo1 = cache.getOrCreate({cwd: '/myrepo'});
// → Creates new Repository

// Connection 2 (same repo)
const repo2 = cache.getOrCreate({cwd: '/myrepo/subdir'});
// → Reuses existing Repository

// Both connections close
// → Repository disposed and removed from cache
```

**Benefits**:
- Shared file watchers
- Shared caches
- Resource efficiency

### 3. Operation Queue

**Problem**: Git operations can conflict if run simultaneously.

**Solution**: OperationQueue serializes operations:

```typescript
// User starts rebase
queue.run(rebaseOp);  // Runs immediately

// User tries to commit (while rebase running)
queue.run(commitOp);  // Queued

// Rebase completes
// → commitOp starts automatically
```

**Benefits**:
- No merge conflicts from concurrent operations
- Progress tracking
- Cancellation support

### 4. Reactive Data Subscriptions

**Problem**: Client needs to know when repository changes.

**Solution**: GraphQL subscriptions + file watching:

```typescript
// Server: File changes detected
watchForChanges.on('commits', () => {
  repository.fetchSmartlogCommits();
  // Emits to all subscribers
});

// Client: Automatic updates
const commits = useAtomValue(latestCommitsData);
// Re-renders when data changes
```

**Benefits**:
- No polling needed
- Real-time updates
- Multiple clients stay in sync

## Sapling → Git Mapping

### Command Mapping

| Sapling Command | Git Equivalent | Notes |
|----------------|----------------|-------|
| `sl log` | `git branchless smartlog --json` | For smartlog view |
| `sl log --rev X` | `git log X` | For specific revisions |
| `sl status` | `git status --porcelain=v2` | Machine-readable format |
| `sl goto COMMIT` | `git checkout COMMIT` | Switch commits |
| `sl rebase -d DEST` | `git branchless rebase DEST` | Stack-aware rebase |
| `sl histedit` | `git branchless rebase -i` | Interactive rebase |
| `sl commit` | `git commit` | Create commit |
| `sl amend` | `git commit --amend` | Modify commit |
| `sl bookmarks` | `git branch` | List branches |
| `sl cat FILE -r REV` | `git show REV:FILE` | Show file at revision |

### Concept Mapping

| Sapling Concept | Git Equivalent | Notes |
|----------------|----------------|-------|
| Bookmark | Branch | Named pointer to commit |
| Smartlog | `git branchless smartlog` | Tree of relevant commits |
| Stack | Branch stack | Related commits built on each other |
| Evolution/Obsolescence | (none) | Not in git, removed from UI |
| Commit Cloud | (none) | Not in git, removed |
| . (dot) | HEAD | Current commit |

## State Management

### Server State

**Repository Instance**:
- Cached per repository root
- Contains:
  - Current commit data
  - Uncommitted changes
  - Operation queue
  - File watcher
  - Config cache

**Operation Queue**:
- Currently running operation
- Queued operations
- Progress state

### Client State (Jotai Atoms)

**Data Atoms**:
- `latestCommitsData`: Commit graph
- `latestUncommittedChangesData`: Modified files
- `latestMergeConflicts`: Conflict state
- `operationBeingPreviewed`: Operation preview

**UI Atoms**:
- `selectedCommits`: User selection
- `commitMessageTemplate`: Draft commit message
- `applicationinfo`: App metadata
- `themeState`: Light/dark mode

**Derived Atoms**:
- Computed from other atoms
- Cached until dependencies change

## File System Watching

### Watchman (Preferred)

```
Watchman daemon
  → Monitors repository
  → Notifies JSL server of changes
    → Repository.fetchUncommittedChanges()
    → Repository.fetchSmartlogCommits()
      → Client updated via subscription
```

**Advantages**:
- Efficient (kernel-level watching)
- Low CPU usage
- Immediate notifications

**Requirements**:
- Watchman installed
- `.watchmanconfig` in repo root

### Polling (Fallback)

```
setInterval(() => {
  repository.fetchUncommittedChanges();
  repository.fetchSmartlogCommits();
}, 3000);
```

**Advantages**:
- Works everywhere
- No dependencies

**Disadvantages**:
- Higher CPU usage
- Delayed updates

## Error Handling

### Command Failures

1. **Non-zero exit code**: Thrown as error
2. **Timeout**: Killed after 60s (configurable)
3. **Parse errors**: Logged and empty result returned

### Merge Conflicts

**Not treated as errors**:
- Special conflict detection
- UI shows conflict resolution interface
- Operations blocked until resolved

### Client-Server Disconnection

- Client attempts reconnection
- Exponential backoff
- Queued operations preserved
- State refetched on reconnection

## Performance Optimizations

### Caching
- Repository instances
- Config values
- Commit data (LRU cache)
- Blame results

### Rate Limiting
- Max 4 simultaneous `git cat-file` calls
- Debounced file watching triggers
- Throttled status checks

### Lazy Loading
- Commits loaded on demand
- File diffs loaded on selection
- Blame loaded on hover

### Incremental Updates
- Only changed files in status
- Diff of commit changes
- Progressive rendering

## Security Considerations

### Command Injection
- All arguments escaped
- No shell evaluation
- Commands validated before execution

### Path Traversal
- Repository root checked
- Relative paths validated
- Symlinks resolved

### Token Authentication
- WebSocket requires token
- Token in URL or header
- Prevents unauthorized access

## Deployment Models

### Standalone (Default)
```
User runs: npm run serve
→ Starts server on http://localhost:3001
→ Opens browser
→ Server runs until stopped
```

### VSCode Extension (Future)
```
Extension activates
→ Starts server as subprocess
→ Opens webview
→ Server lifecycle managed by extension
```

### Remote Server
```
Server runs on remote machine
→ Port forwarded or exposed
→ Browser connects from local machine
→ Token authentication required
```

## Future Architecture Considerations

### VSCode Integration
- Embed server in extension host
- Webview for UI
- VSCode API for file operations
- Settings integration

### Multi-Repository Support
- Switch between repos
- Workspace-level operations
- Shared server instance

### Offline Mode
- Cache commit data
- Queue operations
- Sync when online

### Performance
- Worker threads for heavy operations
- Streaming large results
- Background preloading

