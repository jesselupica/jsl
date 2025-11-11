# JSL Server

## Purpose

The JSL server executes git and git-branchless commands on behalf of the client UI. It manages repository state, watches for changes, and communicates updates via GraphQL subscriptions over WebSocket.

## Architecture

### Core Components

1. **Repository Management**
   - `Repository.ts`: Main class managing a single git repository
   - `RepositoryCache.ts`: Caches Repository instances across connections
   - Watches for file system changes via Watchman (optional)

2. **Command Execution**
   - `commands.ts`: Low-level command runner
   - `GitBranchlessAdapter.ts`: Translates Sapling → git commands
   - Uses `ejeca` for process management

3. **Communication**
   - `ServerToClientAPI.ts`: GraphQL API implementation
   - WebSocket server for real-time updates
   - `index.ts`: Connection handler

4. **Platform Abstraction**
   - `serverPlatform.ts`: Interface for platform-specific operations
   - `platform/`: Implementations for different environments (browser, VSCode, etc.)

## Directory Structure

```
jsl-server/
├── src/
│   ├── Repository.ts              # Main repository class
│   ├── RepositoryCache.ts         # Repository instance cache
│   ├── commands.ts                # Command execution
│   ├── GitBranchlessAdapter.ts    # Sapling→git translation
│   ├── ServerToClientAPI.ts       # GraphQL API
│   ├── index.ts                   # Connection handler
│   ├── OperationQueue.ts          # Sequential operation execution
│   ├── WatchForChanges.ts         # File system watching
│   ├── serverPlatform.ts          # Platform abstraction
│   ├── analytics/                 # Usage tracking
│   ├── github/                    # GitHub integration (stubbed)
│   └── __tests__/                 # Tests
├── proxy/
│   ├── server.ts                  # HTTP/WebSocket server
│   ├── startServer.ts             # Server startup logic
│   └── run-proxy.ts               # Entry point
├── platform/
│   ├── webviewServerPlatform.ts   # Browser/standalone
│   └── ...                        # Other platforms
└── module.md                      # This file
```

## Key Files

### Repository.ts
Central class managing a git repository. Responsibilities:
- Fetch commit history (smartlog)
- Get uncommitted changes (status)
- Run operations (commit, rebase, etc.)
- Manage operation queue
- Watch for file changes
- Cache results

**Key methods:**
- `fetchSmartlogCommits()`: Get commit tree via git-branchless
- `fetchUncommittedChanges()`: Get modified files
- `runOperation()`: Execute user-triggered operations
- `checkForMergeConflicts()`: Detect unresolved conflicts

### GitBranchlessAdapter.ts
Translates Sapling commands to git/git-branchless equivalents.

**Command mappings:**
- `sl status` → `git status --porcelain=v2`
- `sl log` → `git branchless smartlog --json`
- `sl goto` → `git checkout`
- `sl rebase` → `git branchless rebase`
- `sl bookmarks` → `git branch`

**Output transformation:**
- Parses git output
- Converts to ISL-expected format
- Handles different output formats (JSON, porcelain, custom)

### ServerToClientAPI.ts
Implements the GraphQL API for client communication.

**Subscriptions:**
- `smartlogCommits`: Real-time commit data
- `uncommittedChanges`: File changes
- `mergeConflicts`: Conflict status
- `operationProgress`: Operation updates

**Mutations:**
- `runOperation`: Execute git operations
- `setConfig`: Update git config

### OperationQueue.ts
Ensures git operations run sequentially to avoid conflicts.

**Features:**
- Queue operations
- Track progress
- Handle cancellation
- Emit events for UI updates

### WatchForChanges.ts
Monitors repository for changes using:
- **Watchman** (preferred): Efficient file watching daemon
- **Polling** (fallback): Periodic git status checks

Triggers refetches when changes detected.

### commands.ts
Low-level command execution utilities.

**Key functions:**
- `runCommand(ctx, args)`: Execute git command
- `findRoot(ctx)`: Get repository root
- `getConfigs(ctx, names)`: Read git config values
- `setConfig(ctx, level, name, value)`: Write git config

## Server Startup

### Entry Point Flow
```
run-proxy.ts
  → startServer.ts (parseArgs, runProxyMain)
    → server.ts (startServer)
      → HTTP server starts
      → WebSocket server starts
        → index.ts (onClientConnection)
          → ServerToClientAPI created
            → Repository loaded
```

### Command Line Arguments
```bash
npm run serve -- --port 3001 --cwd /path/to/repo
```

See `startServer.ts` for full argument list.

## Git Integration

### Command Translation Example
```typescript
// Client wants to run: sl goto main
// → GitBranchlessAdapter translates to: git checkout main

const translation = translateCommand(['goto', 'main'], ctx);
// translation.command === 'git'
// translation.args === ['checkout', 'main']

const result = await runCommand(ctx, ['goto', 'main']);
// Actually executes: git checkout main
```

### Output Transformation Example
```typescript
// git status --porcelain=v2 output:
// 1 M. N... 100644 100644 100644 hash hash file.txt

// Transformed to ISL format:
{
  files: [{
    path: 'file.txt',
    status: 'M',
    // ... additional metadata
  }]
}
```

## Configuration

### Git Config Integration
JSL reads git config for settings:
- `user.name`, `user.email`: Commit author
- `isl.open-file-cmd`: Command to open files
- Other git settings as needed

### Environment Variables
- `GIT_CMD`: Override git command (default: 'git')
- `PORT`: Server port (default: 3001)

## Error Handling

- Commands that fail emit errors to client
- Operation queue stops on error
- Merge conflicts handled specially (not treated as errors)
- Timeout protection for hung commands (60s default)

## Performance Optimizations

1. **Caching**: Repository instances reused, results cached
2. **Rate Limiting**: Prevents command spam
3. **Watchman**: Efficient file watching vs polling
4. **Lazy Loading**: Only fetch data when needed
5. **Incremental Updates**: Only changed data sent to client

## Testing

```bash
cd jsl-server
npm test
```

Tests cover:
- Command translation
- Repository operations
- Cache behavior
- Error handling

## Future Work

- Complete GitHub integration (PR creation, comments)
- Support more git-branchless operations (sync, hide)
- Better error messages for git-specific issues
- Performance profiling and optimization
- Support for git worktrees

