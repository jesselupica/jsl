# JSL Development Guide

## Getting Started

### Prerequisites

1. **Node.js 18+**
   ```bash
   node --version  # Should be v18 or higher
   ```

2. **Git**
   ```bash
   git --version
   ```

3. **git-branchless** (Required for core functionality)
   ```bash
   # macOS
   brew install git-branchless
   
   # Linux
   cargo install --locked git-branchless
   
   # Verify installation
   git branchless --version
   ```

### Initial Setup

```bash
# Clone the repository
git clone <your-repo-url> jsl
cd jsl

# Install all dependencies
npm install

# Build the server (must be done first)
npm run build:server
```

### Running JSL

#### Development Mode

**Terminal 1 - Server (with watch mode)**:
```bash
npm run watch:server
```

**Terminal 2 - Client (with hot reload)**:
```bash
npm run client
```

Then open http://localhost:3000 in your browser.

#### Production Mode

```bash
# Build everything
npm run build

# Start server
npm run server

# Open http://localhost:3001 in browser
```

### Project Structure

```
jsl/
├── jsl-client/          # React UI application
│   ├── src/             # Source code
│   ├── public/          # Static assets
│   └── build/           # Production build output
│
├── jsl-server/          # Node.js server
│   ├── src/             # Source code
│   ├── proxy/           # Server startup and HTTP handling
│   └── dist/            # Production build output
│
├── shared/              # Shared utilities
│   └── *.ts             # TypeScript utilities
│
├── components/          # UI components
│   └── *.tsx            # React components
│
├── .context/            # AI-native documentation
│   ├── architecture.md
│   ├── git-branchless-integration.md
│   ├── sapling-differences.md
│   └── vscode-extension-plan.md
│
└── module.md files      # Per-directory documentation
```

## Development Workflow

### Making Changes

1. **Server Changes**
   ```bash
   # Server watches for changes automatically if using watch:server
   cd jsl-server
   npm run watch
   ```

2. **Client Changes**
   ```bash
   # Client has hot reload
   cd jsl-client
   npm start
   ```

3. **Shared/Components Changes**
   - Restart server if server uses them
   - Client will hot reload automatically

### Testing Changes

```bash
# Run all tests
npm test

# Run specific package tests
cd jsl-server && npm test
cd jsl-client && npm test
```

### Adding a New Git Operation

1. **Add translation in GitBranchlessAdapter.ts**
   ```typescript
   case 'myoperation':
     return {
       command: 'git',
       args: ['my-git-command', ...rest],
     };
   ```

2. **Add operation in client**
   ```typescript
   // jsl-client/src/operations/MyOperation.ts
   export const myOperation = operation({
     args: () => ['myoperation', '--flag'],
     runner: CommandRunner.Sapling,
   });
   ```

3. **Wire up UI**
   ```tsx
   <Button onClick={() => runOperation(myOperation())}>
     My Operation
   </Button>
   ```

## Debugging

### Server Debugging

**VS Code launch.json**:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "program": "${workspaceFolder}/jsl-server/dist/run-proxy.js",
  "sourceMaps": true,
  "cwd": "${workspaceFolder}"
}
```

**Command Line**:
```bash
node --inspect-brk ./jsl-server/dist/run-proxy.js
# Then attach debugger
```

**Logging**:
```typescript
ctx.logger.log('Debug info:', value);
ctx.logger.error('Error:', error);
```

### Client Debugging

1. Open browser DevTools
2. Go to Sources tab
3. Find source files under `webpack://`
4. Set breakpoints
5. Inspect state via React DevTools

**Console Logging**:
```typescript
console.log('[JSL]', 'Debug info', data);
```

### Common Issues

**"git-branchless not found"**
```bash
# Install git-branchless
brew install git-branchless  # macOS
cargo install --locked git-branchless  # Linux

# Verify it's on PATH
which git-branchless
```

**"Port already in use"**
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use different port
npm run server -- --port 3002
```

**"Module not found" errors**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

**"Cannot find 'git' command"**
```bash
# Set GIT_CMD environment variable
export GIT_CMD=/path/to/git
npm run server
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over types
- Use meaningful variable names
- Add JSDoc comments for public APIs

### React

- Functional components only
- Use Jotai for global state
- useState for local state
- Prefer const over let

### Formatting

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

### Linting

```bash
# Lint all files
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

## Building for Production

```bash
# Clean previous builds
npm run clean

# Build everything
npm run build

# Test production build
npm run serve
```

## Git Workflow

### Branching Strategy

- `main`: Stable, deployable code
- `feature/x`: New features
- `fix/x`: Bug fixes
- `refactor/x`: Refactoring

### Commit Messages

Follow conventional commits:
```
type(scope): description

[optional body]
[optional footer]
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Examples:
```
feat(server): add git-branchless smartlog integration
fix(client): resolve drag-drop rebase issue
docs(readme): update installation instructions
```

### Before Committing

```bash
# Format code
npm run format

# Run tests
npm test

# Check types
npm run typecheck
```

## Useful Commands

```bash
# Clean all build artifacts
npm run clean

# Rebuild everything from scratch
npm run clean && npm install && npm run build

# Watch server for changes
npm run watch:server

# Start client dev server
npm run client

# Run tests in watch mode
npm test -- --watch

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

## Environment Variables

```bash
# Server
export GIT_CMD=/usr/local/bin/git  # Custom git path
export PORT=3001                    # Server port

# Development
export NODE_ENV=development         # Development mode
export DEBUG=jsl:*                  # Enable debug logging
```

## Troubleshooting

### Server won't start

1. Check Node.js version: `node --version` (needs 18+)
2. Check port availability: `lsof -i:3001`
3. Check server logs in terminal
4. Try different port: `npm run serve -- --port 3002`

### Client won't connect

1. Check server is running
2. Check WebSocket URL in browser console
3. Check firewall settings
4. Try incognito window (clears cache)

### git-branchless commands fail

1. Check installation: `git branchless --version`
2. Initialize in repo: `git branchless init`
3. Check PATH: `echo $PATH`
4. Try full path: `export GIT_CMD=/usr/local/bin/git`

### TypeScript errors

1. Rebuild: `npm run build`
2. Clean: `rm -rf dist/ && npm run build`
3. Check tsconfig.json
4. Update @types packages

## Getting Help

- Read `module.md` files in each directory
- Check `.context/` documentation
- Look at existing code for examples
- Check git-branchless docs: https://github.com/arxanas/git-branchless/wiki

## Contributing

1. Read module.md files to understand architecture
2. Check .context/ for detailed design docs
3. Write tests for new features
4. Update documentation
5. Follow code style guidelines
6. Submit PR with clear description

