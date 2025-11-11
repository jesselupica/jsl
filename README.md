# JSL - Interactive Git SmartLog

JSL is an interactive, web-based interface for visualizing and managing git repositories using single-author, feature branch-based development workflows. It's inspired by Sapling's Interactive SmartLog (ISL) but designed specifically for git-native workflows with git-branchless integration.

## Features

- **Visual Commit Graph**: See your feature branches and their relationships at a glance
- **Master as Baseline**: Master/main branch is shown as a reference line, not cluttering the view
- **Interactive Operations**: Drag-drop branches, rebase stacks, and manage commits visually
- **Git-Branchless Integration**: Powered by git-branchless for robust stack management
- **File Changes Sidebar**: View committed and uncommitted changes inline
- **VSCode Extension Ready**: Designed to be integrated as a VSCode extension

## Architecture

JSL is a monorepo containing:

- **jsl-client**: React TypeScript UI (based on ISL's client)
- **jsl-server**: Node.js TypeScript server that executes git-branchless commands
- **shared**: Shared utilities and types
- **components**: Reusable UI components

Communication between client and server uses GraphQL over WebSocket.

## Prerequisites

- Node.js 18+
- Git
- [git-branchless](https://github.com/arxanas/git-branchless) installed and on PATH

## Getting Started

```bash
# Install dependencies
npm install

# Build the server
npm run build:server

# Start development
npm run dev
```

In another terminal:
```bash
# Start the client
npm run client
```

## Development

The project uses:
- React 18 with TypeScript
- Jotai for state management
- Vite for client bundling
- Rollup for server bundling
- GraphQL for client-server communication

## AI-Native Development

This project follows AI-native development practices:
- Each module has a `module.md` file describing its purpose and structure
- The `.context/` directory contains architecture documentation
- Memory and context files help AI assistants understand the codebase

## License

MIT

