# JSL (Interactive Git SmartLog)

## Overview

JSL is a fork and adaptation of Sapling's Interactive SmartLog (ISL) for git-native workflows. It provides a visual, interactive interface for managing git repositories using single-author, feature branch-based development with git-branchless integration.

## Project Structure

```
jsl/
├── jsl-client/          # React TypeScript UI application
├── jsl-server/          # Node.js TypeScript server for git operations
├── shared/              # Shared utilities and types used by both client and server
├── components/          # Reusable UI components
├── sapling-upstream/    # Original Sapling source (for reference, not deployed)
├── .context/            # AI-native development context files
└── module.md            # This file
```

## Architecture

### Three-Tier Architecture

1. **Client (jsl-client)**
   - React 18 with TypeScript
   - Jotai for state management
   - Vite for building
   - Communicates with server via GraphQL/WebSocket

2. **Server (jsl-server)**
   - Node.js with TypeScript
   - Executes git and git-branchless commands
   - Watches for repository changes
   - Transforms git output to ISL-expected formats

3. **Shared Libraries**
   - Type definitions
   - Common utilities
   - Communication protocols

### Key Design Decisions

**Git vs Sapling**
- ISL was designed for Sapling (Meta's VCS based on Mercurial)
- JSL adapts ISL to work with git-branchless
- GitBranchlessAdapter translates Sapling commands → git equivalents

**Feature Branch Workflow**
- Master/main branch shown as reference line only
- All development in feature branches
- Stacked branches supported via git-branchless
- No merge commits (rebase-only workflow)

**Local-First**
- Only local git state is displayed
- Remote tracking branches are implicit (same name as local)
- Push operations use `--set-upstream` to create remotes automatically

## Key Technologies

- **React 18**: UI framework
- **TypeScript 5.5**: Type safety across the stack
- **Jotai**: State management (replaced Recoil in ISL)
- **GraphQL**: Client-server API
- **WebSocket**: Real-time updates
- **Vite**: Fast development and building
- **git-branchless**: Stack management and smartlog
- **Watchman**: Efficient file watching (optional)

## Development Workflow

### Setup
```bash
npm install                # Install all dependencies
npm run build:server       # Build server first
```

### Running
```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Start client
npm run client
```

### Building
```bash
npm run build             # Build both client and server
```

## Integration Points

### With git-branchless
- Requires git-branchless installed and on PATH
- Used for: smartlog, rebase, stack management
- Commands translated via GitBranchlessAdapter

### With Git
- Standard git commands for: status, commit, checkout, etc.
- Custom output parsing to match ISL expectations
- Enforces rebase-only workflow

### For VSCode Extension
- Architecture supports embedding in VSCode
- Server can run as subprocess
- UI renders in VSCode webview
- Extension scaffolding in `jsl-vscode/` (future)

## Common Tasks

### Adding a New Git Operation
1. Add translation in `GitBranchlessAdapter.ts`
2. Update output transformation if needed
3. Add operation to `Repository.ts` if complex
4. Update UI to trigger the operation

### Debugging Command Translation
- Check `jsl-server/src/GitBranchlessAdapter.ts`
- Server logs show translated commands
- Use `--command git` flag to override

### Working with Types
- Shared types in `shared/types/`
- Client types in `jsl-client/src/types.ts`
- Update both when changing data structures

## AI-Native Development

This project follows AI-native development practices:

- Each module has a `module.md` explaining its purpose
- `.context/` directory contains architecture docs
- Memory files capture important decisions
- Context files help AI assistants understand the codebase

See `.context/architecture.md` for detailed system design.

## Contributing

When adding new features:
1. Update relevant `module.md` files
2. Add context to `.context/` if it's architectural
3. Follow the existing code style
4. Test with both git and git-branchless operations

## License

MIT (inherited from Sapling ISL)

