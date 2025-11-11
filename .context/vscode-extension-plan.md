# VSCode Extension Plan

## Vision

JSL will be available as a VSCode extension, providing the Interactive SmartLog directly inside the editor. This allows developers to manage git operations without leaving their coding environment.

## Current Status

**Phase**: Architecture designed for extension, but not yet implemented

**What's Ready**:
- Server can run as subprocess
- Client UI works in webview
- Platform abstraction exists
- Communication via WebSocket

**What's Needed**:
- Extension manifest (`package.json`)
- Extension activation logic
- Webview hosting
- Server lifecycle management

## Architecture

### Extension Components

```
VSCode Extension
├── Extension Host Process
│   ├── Extension activation
│   ├── Commands registration
│   ├── Webview panel management
│   └── Server subprocess management
│       └── JSL Server (Node.js)
│           └── Git/git-branchless execution
└── Webview Panel
    └── JSL Client (React app)
```

### Communication Flow

```
User clicks "JSL: Open" command
  → Extension activates
    → Spawn JSL server as subprocess
      → Server starts on random port
      → Server returns WebSocket URL
    → Create webview panel
      → Load JSL client HTML
      → Client connects to WebSocket
        → Full JSL UI rendered
```

## Extension Manifest

### package.json

```json
{
  "name": "jsl-vscode",
  "displayName": "JSL - Interactive Git SmartLog",
  "description": "Visual git repository manager with stack support",
  "version": "0.1.0",
  "publisher": "jsl",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["SCM Providers", "Visualization"],
  "activationEvents": [
    "onCommand:jsl.open",
    "onView:jsl.view",
    "workspaceContains:.git"
  ],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "jsl.open",
        "title": "JSL: Open Interactive SmartLog",
        "icon": "$(git-branch)"
      },
      {
        "command": "jsl.refresh",
        "title": "JSL: Refresh",
        "icon": "$(refresh)"
      }
    ],
    "views": {
      "scm": [
        {
          "id": "jsl.view",
          "name": "JSL SmartLog",
          "icon": "resources/jsl-icon.svg"
        }
      ]
    },
    "configuration": {
      "title": "JSL",
      "properties": {
        "jsl.gitCommand": {
          "type": "string",
          "default": "git",
          "description": "Path to git executable"
        },
        "jsl.autoOpen": {
          "type": "boolean",
          "default": false,
          "description": "Automatically open JSL when opening git repository"
        }
      }
    }
  }
}
```

## Implementation Plan

### Phase 1: Basic Extension (MVP)

**Goal**: JSL opens in VSCode panel

**Tasks**:
1. Create `jsl-vscode/` directory
2. Set up extension manifest
3. Implement extension activation
4. Spawn JSL server subprocess
5. Create webview panel
6. Load JSL client in webview
7. Handle server lifecycle

**Files to Create**:
```
jsl-vscode/
├── src/
│   ├── extension.ts       # Main extension code
│   ├── server.ts          # Server subprocess management
│   ├── webview.ts         # Webview panel management
│   └── config.ts          # Extension configuration
├── resources/
│   └── jsl-icon.svg       # Extension icon
├── package.json           # Extension manifest
├── tsconfig.json          # TypeScript config
└── README.md              # Extension docs
```

**Estimated Effort**: 1-2 weeks

### Phase 2: VSCode Integration

**Goal**: Use VSCode APIs for better integration

**Features**:
- Open files in VSCode editor (not external)
- Show diffs in VSCode diff viewer
- Integrate with VSCode git extension
- Use VSCode's credential manager
- Status bar integration

**Tasks**:
1. Implement `vscodeServerPlatform.ts`
2. Handle file open commands
3. Handle diff commands
4. Share git state with VSCode
5. Add status bar items

**Estimated Effort**: 2-3 weeks

### Phase 3: Enhanced Features

**Goal**: Take advantage of VSCode environment

**Features**:
- Keyboard shortcuts
- Quick pick for commit selection
- Tree view in sidebar (alternative to webview)
- Commit message snippets
- Git integration settings sync

**Tasks**:
1. Register keyboard shortcuts
2. Implement tree view provider
3. Add command palette commands
4. Create commit message snippets
5. Sync settings with git config

**Estimated Effort**: 2-3 weeks

### Phase 4: Publishing

**Goal**: Available on VSCode Marketplace

**Tasks**:
1. Create publisher account
2. Add marketplace metadata
3. Create demo screenshots/video
4. Write marketplace README
5. Set up CI/CD for releases
6. Publish to marketplace

**Estimated Effort**: 1 week

## Code Structure

### extension.ts

Main extension entry point:

```typescript
import * as vscode from 'vscode';
import {ServerManager} from './server';
import {WebviewManager} from './webview';

let serverManager: ServerManager;
let webviewManager: WebviewManager;

export async function activate(context: vscode.ExtensionContext) {
  // Start server
  serverManager = new ServerManager(context);
  await serverManager.start();
  
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('jsl.open', () => {
      webviewManager = new WebviewManager(context, serverManager);
      webviewManager.show();
    })
  );
}

export function deactivate() {
  serverManager?.stop();
  webviewManager?.dispose();
}
```

### server.ts

Server subprocess management:

```typescript
export class ServerManager {
  private process: ChildProcess | null = null;
  private port: number = 0;
  private token: string = '';
  
  async start(): Promise<void> {
    // Spawn JSL server
    this.process = spawn('node', [
      path.join(extensionPath, 'dist/jsl-server.js'),
      '--port', '0',  // Random port
      '--no-open',    // Don't open browser
    ]);
    
    // Parse output for port and token
    // ...
  }
  
  stop(): void {
    this.process?.kill();
  }
  
  getUrl(): string {
    return `http://localhost:${this.port}/?token=${this.token}`;
  }
}
```

### webview.ts

Webview panel management:

```typescript
export class WebviewManager {
  private panel: vscode.WebviewPanel | null = null;
  
  show(): void {
    this.panel = vscode.window.createWebviewPanel(
      'jsl',
      'JSL SmartLog',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );
    
    // Load JSL client
    this.panel.webview.html = this.getWebviewContent();
  }
  
  private getWebviewContent(): string {
    const serverUrl = serverManager.getUrl();
    return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JSL</title>
      </head>
      <body>
        <iframe src="${serverUrl}" style="width:100%;height:100vh;border:none;"></iframe>
      </body>
    </html>`;
  }
}
```

## VSCode Platform Implementation

### vscodeServerPlatform.ts

```typescript
export const vscodeServerPlatform: ServerPlatform = {
  platformName: 'vscode',
  
  handleMessageFromClient(repo, ctx, message, postMessage) {
    switch (message.type) {
      case 'platform/openFile':
        // Use VSCode API to open file
        const uri = vscode.Uri.file(message.path);
        vscode.window.showTextDocument(uri);
        break;
        
      case 'platform/openDiff':
        // Use VSCode diff viewer
        const leftUri = vscode.Uri.parse(`jsl-diff:${message.left}`);
        const rightUri = vscode.Uri.parse(`jsl-diff:${message.right}`);
        vscode.commands.executeCommand('vscode.diff', leftUri, rightUri);
        break;
    }
  },
};
```

## User Experience

### Installation

```
1. User opens VSCode
2. Opens Extensions panel (Ctrl+Shift+X)
3. Searches for "JSL" or "Interactive Git SmartLog"
4. Clicks "Install"
5. Reloads window
```

### First Use

```
1. User opens git repository
2. Sees "JSL SmartLog" in SCM sidebar
3. Clicks on it (or runs command: JSL: Open)
4. JSL panel opens
5. If git-branchless not installed:
   → Shows installation instructions
6. Otherwise:
   → Shows commit graph
```

### Daily Workflow

```
1. User writes code
2. Opens JSL panel
3. Sees uncommitted changes
4. Reviews changes
5. Commits via JSL UI
6. Rebases if needed
7. Pushes via JSL
8. Continues coding
```

## Configuration

### Extension Settings

```typescript
interface JSLConfiguration {
  // Path to git executable
  gitCommand: string;  // default: "git"
  
  // Automatically open JSL when opening repo
  autoOpen: boolean;  // default: false
  
  // Port for server (0 = random)
  serverPort: number;  // default: 0
  
  // Enable Watchman
  useWatchman: boolean;  // default: true
  
  // Days of commits to load
  daysOfCommits: number;  // default: 14
}
```

### Reading Configuration

```typescript
const config = vscode.workspace.getConfiguration('jsl');
const gitCommand = config.get<string>('gitCommand', 'git');
```

## Packaging

### Build Process

```bash
# Build server
cd jsl-server && npm run build

# Build client
cd jsl-client && npm run build

# Build extension
cd jsl-vscode && npm run build

# Package extension
vsce package
# Creates: jsl-vscode-0.1.0.vsix
```

### Bundle Contents

```
jsl-vscode-0.1.0.vsix
├── extension.js         # Extension code
├── jsl-server/         # Bundled server
│   └── dist/
├── jsl-client/         # Bundled client
│   └── build/
├── package.json        # Manifest
└── README.md          # Docs
```

## Testing

### Manual Testing

```bash
# Open extension development host
code --extensionDevelopmentPath=/path/to/jsl-vscode

# Or press F5 in VSCode with jsl-vscode open
```

### Automated Testing

```typescript
// test/suite/extension.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  test('Extension activates', async () => {
    const ext = vscode.extensions.getExtension('jsl.jsl-vscode');
    await ext?.activate();
    assert.ok(ext.isActive);
  });
});
```

## Marketplace Listing

### Description

> JSL brings an interactive, visual interface for managing git repositories inside VSCode. See your feature branches, rebase stacks, and manage commits with drag-and-drop ease. Powered by git-branchless for advanced stack management.

### Features

- 📊 Visual commit graph
- 🎯 Drag-and-drop rebasing
- 📝 Inline file changes
- ⚡ Stack management with git-branchless
- 🎨 Light and dark themes
- ⌨️ Keyboard shortcuts

### Requirements

- Git installed
- git-branchless recommended (not required)

## Future Enhancements

### Alternative Views

- Tree view in sidebar (compact)
- Timeline view
- Graph view in editor

### Git Integration

- Sync with VSCode's built-in Git
- Share staged changes
- Unified status bar

### AI Features

- Commit message suggestions
- Smart rebase recommendations
- Conflict resolution hints

## Resources

- [VSCode Extension API](https://code.visualstudio.com/api)
- [VSCode Webview Guide](https://code.visualstudio.com/api/extension-guides/webview)
- [Extension Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

