# JSL VSCode Extension Module

## Purpose

Integrates JSL (Interactive Git SmartLog) into Visual Studio Code as a native extension. Provides visual git repository management without leaving the editor.

## Architecture

```
VSCode Extension Host
├── extension.ts (activation & commands)
├── serverManager.ts (JSL server subprocess)
├── webviewManager.ts (UI panel)
└── dependencyCheck.ts (validate external deps)
```

### How It Works

1. **Extension Activates** (when opening git repo)
   - Checks for git and git-branchless
   - Starts JSL server as subprocess
   - Registers commands

2. **User Opens JSL** (via command or auto-open)
   - Creates webview panel
   - Loads JSL client in iframe
   - Connects to local server

3. **User Interacts** (commits, rebases, etc.)
   - UI sends commands to server
   - Server executes git operations
   - Updates stream back to UI

## Key Files

### extension.ts

Main entry point for the extension.

**Responsibilities**:
- Extension activation/deactivation
- Dependency checking
- Command registration
- Auto-open logic

**Activation events**:
- `onCommand:jsl.open` - Manual open
- `workspaceContains:.git` - Auto-activate in git repos

**Commands registered**:
- `jsl.open` - Open JSL panel
- `jsl.refresh` - Refresh JSL
- `jsl.checkDependencies` - Show dependency status

### serverManager.ts

Manages the JSL server subprocess.

**Responsibilities**:
- Spawn server process
- Parse server output for port/token
- Monitor server health
- Kill server on deactivation

**Server startup**:
```typescript
spawn('node', [
  '--enable-source-maps',
  serverPath,
  '--port', '0',  // Random port
  '--no-open',    // Don't open browser
  '--stdout',     // Log to stdout
  '--cwd', workspaceRoot,
])
```

**URL generation**:
```typescript
getUrl(): string {
  return `http://localhost:${port}/?token=${token}&cwd=${workspace}`;
}
```

### webviewManager.ts

Manages the webview panel showing JSL UI.

**Responsibilities**:
- Create/destroy webview panels
- Generate webview HTML
- Handle iframe with JSL client
- Refresh on demand

**HTML structure**:
```html
<iframe src="http://localhost:3001/?token=...&cwd=...">
```

**Webview options**:
- `enableScripts: true` - JSL client needs JavaScript
- `retainContextWhenHidden: true` - Keep state when switching tabs
- `sandbox: "allow-scripts allow-same-origin allow-forms"` - Security

### dependencyCheck.ts

Validates required dependencies are installed.

**Checks**:
- Git installed and version
- git-branchless installed and version
- Watchman installed (optional)

**User experience**:
- Shows error notification if deps missing
- Provides "View Installation Instructions" button
- Opens installation URLs in browser
- Can be run manually via command

## VSCode Integration Points

### Extension Manifest (package.json)

**Activation Events**:
- Extension activates when git repo opened
- Or when user runs JSL command

**Contributed Commands**:
- Appear in Command Palette (Ctrl+Shift+P)
- Can have keybindings

**Configuration**:
- Settings appear in VSCode Settings UI
- Synced across machines via Settings Sync

**Views**:
- Custom activity bar icon
- Sidebar view (potential alternative to webview)

### Extension Context

```typescript
context.extensionPath  // Path to extension files
context.globalState    // Persistent storage
context.subscriptions  // Disposables to clean up
```

### VSCode APIs Used

**Window**:
- `vscode.window.createWebviewPanel()` - Create UI panel
- `vscode.window.showErrorMessage()` - Show errors
- `vscode.window.showInformationMessage()` - Show info

**Workspace**:
- `vscode.workspace.workspaceFolders` - Get workspace root
- `vscode.workspace.getConfiguration()` - Read settings

**Commands**:
- `vscode.commands.registerCommand()` - Register commands
- `vscode.commands.executeCommand()` - Run commands

**Environment**:
- `vscode.env.openExternal()` - Open URLs in browser

## Deployment

### Development

```bash
# Build extension
cd jsl-vscode
npm run build

# Open extension development host (F5)
code --extensionDevelopmentPath=/path/to/jsl/jsl-vscode
```

### Packaging

```bash
# Install vsce if needed
npm install -g @vscode/vsce

# Package extension
cd jsl-vscode
npm run package

# Creates: jsl-vscode-0.1.0.vsix
```

### Publishing

```bash
# Create publisher account on marketplace
# Get Personal Access Token from Azure DevOps

# Login
vsce login <publisher-name>

# Publish
vsce publish
```

## User Experience

### First Install

```
1. User installs extension
2. Opens git repository
3. Extension activates
   ↓ (checks dependencies)
4a. All deps installed → JSL opens
4b. Deps missing → Shows error with install links
   ↓ (user installs deps)
5. Reload VSCode
6. JSL opens successfully
```

### Daily Usage

```
1. User opens project in VSCode
2. Extension auto-activates (checks deps)
3. User clicks JSL icon or runs command
4. Webview opens with JSL UI
5. User manages commits visually
6. Changes reflected in git
7. VSCode git extension stays in sync
```

## Integration with VSCode Git

JSL and VSCode's built-in git extension can coexist:

- **VSCode Git**: Good for simple commits, diffs
- **JSL**: Good for stacks, rebasing, visualization

Potential future integration:
- Share staging area
- Sync file selection
- Unified status bar
- Shared keybindings

## Future Enhancements

### Phase 1 (Current - Basic Extension)
- [x] Extension manifest
- [x] Server subprocess management
- [x] Webview integration
- [x] Dependency checking
- [ ] Build and package

### Phase 2 (Enhanced Integration)
- [ ] Use VSCode file opener (not external)
- [ ] Use VSCode diff viewer
- [ ] Status bar integration
- [ ] Tree view provider (alternative to webview)

### Phase 3 (Advanced Features)
- [ ] Keyboard shortcuts
- [ ] Quick pick for commit selection
- [ ] Commit message snippets
- [ ] Settings sync with git config

## Testing

### Manual Testing

```bash
# Build everything
npm run build

# Package extension
cd jsl-vscode && npm run package

# Install in VSCode
code --install-extension jsl-vscode-0.1.0.vsix

# Test
# - Open a git repository
# - Run: JSL: Open Interactive SmartLog
# - Verify UI appears
# - Test basic operations
```

### Extension Tests

```bash
# Run extension tests
cd jsl-vscode
npm test
```

## Security Considerations

### Sandbox

Webview runs in sandboxed iframe with:
- `allow-scripts` - JSL client needs JavaScript
- `allow-same-origin` - For WebSocket to localhost
- `allow-forms` - For commit message input

### Authentication

- Server requires token in URL
- Token generated on server startup
- Token changes on each server restart
- Prevents unauthorized access

### Process Isolation

- Server runs as separate Node process
- Crashes don't affect VSCode
- Can be restarted independently
- Clean shutdown on extension deactivate

## Performance

### Server Lifecycle

- Server starts once per workspace
- Stays running while VSCode open
- Shared across multiple webview instances
- Stopped when VSCode closes

### Resource Usage

- Server: ~50-100MB RAM
- Webview: ~50-100MB RAM
- Total: ~100-200MB (acceptable for VSCode extension)

### Optimization

- Server uses caching
- Watchman for efficient file watching
- Lazy loading of commit data
- Incremental updates via WebSocket

## Known Limitations

### Current

- Server must be Node.js (can't compile to native)
- Requires external dependencies (can't bundle)
- WebSocket limited to localhost
- No offline mode

### VSCode-Specific

- Webview has some limitations vs standalone
- Can't access certain VSCode APIs from webview
- Message passing required for tight integration

## Resources

- VSCode Extension API: https://code.visualstudio.com/api
- Extension Guide: https://code.visualstudio.com/api/extension-guides/webview
- Publishing: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- JSL Architecture: ../.context/architecture.md

