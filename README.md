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

### Required

1. **Node.js 18+**
   ```bash
   node --version  # Should be v18 or higher
   ```

2. **Git 2.30+**
   ```bash
   git --version
   ```

3. **git-branchless 0.7.0+** ⚠️ **REQUIRED**
   
   git-branchless is **required** for JSL to function. It provides the smartlog visualization and stack management that makes JSL valuable.
   
   **macOS**:
   ```bash
   brew install git-branchless
   ```
   
   **Linux**:
   ```bash
   cargo install --locked git-branchless
   # Or download binary from: https://github.com/arxanas/git-branchless/releases
   ```
   
   **Windows**:
   ```bash
   # Download binary from: https://github.com/arxanas/git-branchless/releases
   ```
   
   **Verify**:
   ```bash
   git branchless --version
   ```
   
   **Initialize in your repository**:
   ```bash
   cd /path/to/your/repo
   git branchless init
   ```

### Optional

4. **Watchman** (Recommended for performance)
   ```bash
   brew install watchman  # macOS
   ```
   
   Without Watchman, JSL uses polling (slower but works).

## Getting Started

### 1. Install External Dependencies

**Critical**: JSL will not start without git-branchless!

```bash
# macOS
brew install git-branchless

# Verify installation
git branchless --version

# Initialize in your repository
cd /path/to/your/repo
git branchless init
```

See [DEPENDENCIES.md](DEPENDENCIES.md) for detailed installation instructions for all platforms.

### 2. Install Node Dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Build the Server

```bash
npm run build:server
```

### 4. Start JSL

**Option A: Production Mode (Recommended for first run)**
```bash
cd jsl-server
npm run serve
```

Then open the URL it prints (e.g., http://localhost:3001/?token=...)

**Option B: Development Mode (For active development)**

Terminal 1:
```bash
npm run dev  # or cd jsl-server && npm run watch
```

Terminal 2:
```bash
npm run client  # or cd jsl-client && npm start
```

Then open http://localhost:3000

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

