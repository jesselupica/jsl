# JSL Client

## Purpose

The JSL client is a React-based web application that provides an interactive visual interface for managing git repositories. It's a fork of Sapling's ISL client, adapted for git workflows.

## Architecture

### State Management
- **Jotai**: Atom-based state management for reactive updates
- **GraphQL Subscriptions**: Real-time data from server via WebSocket
- **Local State**: Component-level state for UI interactions

### Key Features
1. **Commit Graph Visualization**: Interactive tree of commits and branches
2. **Uncommitted Changes**: File list with diff preview
3. **Operations**: Rebase, commit, amend, checkout via UI interactions
4. **Conflict Resolution**: UI for resolving merge conflicts
5. **Drag and Drop**: Reorder commits and move branches

## Directory Structure

```
jsl-client/
├── src/
│   ├── CommitInfoView/      # Commit detail sidebar
│   ├── CommitTreeList.tsx   # Main commit visualization
│   ├── UncommittedChanges.tsx # Staged/unstaged files
│   ├── operations/          # Git operations (commit, rebase, etc.)
│   ├── types.ts             # TypeScript type definitions
│   ├── serverAPIState.ts    # GraphQL client setup
│   └── ...
├── public/                  # Static assets
├── index.html               # Entry HTML
├── vite.config.ts           # Vite build configuration
└── module.md                # This file
```

## Key Files

### CommitTreeList.tsx
The main UI component showing the tree of commits. Handles:
- Rendering commit nodes with metadata
- Branch/bookmark badges
- "You are here" indicator
- Drag-drop interactions

### UncommittedChanges.tsx
Shows files that have been modified but not committed. Features:
- File status indicators (added, modified, deleted)
- Commit message input
- Commit/Amend buttons
- File selection for partial commits

### operations/
Directory containing operation implementations:
- `CommitOperation.ts`: Creating commits
- `AmendOperation.ts`: Amending commits  
- `RebaseOperation.ts`: Rebasing stacks
- `GotoOperation.ts`: Switching branches/commits
- Each operation sends commands to server

### serverAPIState.ts
Sets up the GraphQL client and WebSocket connection:
- Subscription management
- Query execution
- Connection state handling
- Automatic reconnection

### types.ts
TypeScript definitions for:
- CommitInfo (commit metadata)
- UncommittedChanges (file status)
- Operations (runnable commands)
- UI state

## GraphQL Integration

The client subscribes to real-time data from the server:

```typescript
// Commits subscription
subscription {
  smartlogCommits {
    commits {
      hash
      author
      date
      title
      parents
      bookmarks
    }
  }
}

// Uncommitted changes subscription
subscription {
  uncommittedChanges {
    files {
      path
      status
    }
  }
}
```

## Adapting from ISL

### What Changed
- Removed Sapling-specific UI (obsolescence markers, evolution)
- Adapted "bookmarks" terminology to "branches"
- Stubbed GitHub integration (will be re-implemented)
- Removed commit cloud features

### What Stayed the Same
- Overall UI layout and design
- Commit graph rendering algorithm
- Operation queue system
- Drag-drop interactions

## Common UI Patterns

### Running Operations
```typescript
import {operationList} from './operations/operationList';

// Queue an operation
operationList.runOperation({
  runner: CommandRunner.Sapling, // Actually runs git
  args: ['commit', '-m', 'My message'],
});
```

### Accessing State
```typescript
import {latestCommitsData} from './serverAPIState';
import {useAtomValue} from 'jotai';

function MyComponent() {
  const commits = useAtomValue(latestCommitsData);
  // commits contains the smartlog data
}
```

### Subscriptions
All data automatically updates via GraphQL subscriptions. No manual polling needed.

## Styling

- **StyleX**: Facebook's CSS-in-JS solution
- **CSS Modules**: Some legacy styles
- **Theming**: Light/dark mode support

## Development

### Running Dev Mode
```bash
cd jsl-client
npm start
```

This starts Vite dev server on port 3000 with hot reload.

### Building
```bash
npm run build
```

Outputs to `build/` directory, ready to serve.

### Testing
```bash
npm test                    # Unit tests
npm run integration        # Integration tests
```

## Future Work

- Complete GitHub integration for PR management
- Add more git-specific operations (interactive rebase UI)
- Improve branch visualization
- Add keyboard shortcuts for all operations
- Better conflict resolution UI

