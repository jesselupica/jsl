# JSL Server Source Module

This module contains the core server-side logic for JSL (Interactive Git SmartLog).

## Purpose

The JSL server acts as a bridge between the React client UI and git/git-branchless operations. It:
- Executes git and git-branchless commands
- Transforms command output to formats expected by the client
- Manages WebSocket connections for real-time updates
- Watches for repository changes and notifies the client

## Key Files

### GitBranchlessAdapter.ts
**Purpose**: Translates Sapling (sl) commands to git/git-branchless equivalents.

This is the core translation layer that allows us to reuse ISL's command interface while working with git repositories. Each Sapling command is mapped to its git counterpart:
- `sl status` → `git status --porcelain=v2`
- `sl log` → `git log` or `git branchless smartlog`
- `sl goto` → `git checkout`
- `sl rebase` → `git branchless rebase`
- `sl bookmarks` → `git branch`

The adapter also handles output transformation, converting git's output format to match what ISL expects.

### Repository.ts
**Purpose**: Main repository management class.

Manages a single git repository connection, including:
- Fetching commit history and status
- Running operations (commit, rebase, etc.)
- Managing the operation queue
- Watching for file changes
- Caching results

This file has been modified to use GitBranchlessAdapter instead of calling Sapling directly.

### commands.ts
**Purpose**: Low-level command execution utilities.

Contains `runCommand()` which executes git commands via `ejeca` (a better `exec`). Also includes helper functions for:
- Finding repository root
- Getting/setting git config
- Parsing conflict information

Modified to use git instead of sl as the base command.

### serverPlatform.ts
**Purpose**: Platform-specific server implementations.

Defines the interface for platform-specific operations like opening files in editors. Implementations exist for:
- Browser/standalone (default)
- VSCode extension
- Visual Studio extension
- Android Studio

### ServerToClientAPI.ts
**Purpose**: Defines the GraphQL API for client-server communication.

Handles WebSocket connections and GraphQL subscriptions for:
- Commit data
- Uncommitted changes
- Merge conflicts
- Operation progress

### OperationQueue.ts
**Purpose**: Manages sequential execution of git operations.

Ensures operations like rebase, commit, amend run one at a time to avoid conflicts. Handles:
- Queueing operations
- Progress reporting
- Cancellation
- Error handling

## Dependencies

- **execa**: Process execution (via shared/ejeca wrapper)
- **fb-watchman**: File watching for efficient change detection
- **ws**: WebSocket server for client communication
- **jsl-client**: TypeScript types shared with client
- **shared**: Common utilities

## Integration Points

### With Client
- GraphQL subscriptions over WebSocket
- JSON-formatted command output
- Progress events during long operations

### With Git
- Shell out to `git` and `git branchless` commands
- Parse output formats (JSON, porcelain, custom)
- Handle stdin for interactive operations

### With git-branchless
- `git branchless smartlog` for commit visualization
- `git branchless rebase` for stack management
- `git branchless move` for branch manipulation

## Common Operations

### Fetching Commits
```typescript
await repository.fetchSmartlogCommits();
// Uses: git branchless smartlog --json
```

### Running a Rebase
```typescript
await repository.runOperation({
  runner: CommandRunner.Sapling,
  args: ['rebase', '-d', 'main'],
});
// Translates to: git branchless rebase main
```

### Checking Status
```typescript
await repository.fetchUncommittedChanges();
// Uses: git status --porcelain=v2
```

## Future Work

- Complete output transformation functions in GitBranchlessAdapter
- Add support for more git-branchless features (sync, hide, etc.)
- Implement GitHub integration for PR management
- Add better error messages for git-specific issues

