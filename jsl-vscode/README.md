# JSL VSCode Extension

Visual git repository manager with interactive smartlog and stack support.

## Features

- 📊 **Visual Commit Graph**: See your feature branches and their relationships
- 🎯 **Interactive Operations**: Drag-drop to rebase, click to checkout
- 📝 **Inline File Changes**: View committed and uncommitted changes
- ⚡ **Stack Management**: Powered by git-branchless
- 🎨 **Beautiful UI**: Modern, themed interface matching VSCode

## Requirements

### Required

- **Git 2.30+**: Standard git installation
- **git-branchless 0.7.0+**: For smartlog and stack management
  - macOS: `brew install git-branchless`
  - Linux: `cargo install --locked git-branchless`
  - Windows: Download from [releases](https://github.com/arxanas/git-branchless/releases)

### Optional

- **Watchman**: For efficient file watching (recommended)
  - macOS: `brew install watchman`

## Installation

1. **Install from VSCode Marketplace** (when published)
   - Open Extensions panel (Ctrl+Shift+X)
   - Search for "JSL" or "Interactive Git SmartLog"
   - Click Install

2. **Install from VSIX** (for development)
   ```bash
   cd jsl-vscode
   npm install
   npm run package
   code --install-extension jsl-vscode-0.1.0.vsix
   ```

## First Time Setup

1. **Install git-branchless** (if not already installed)
   ```bash
   brew install git-branchless
   ```

2. **Open a git repository in VSCode**

3. **Open JSL**
   - Run command: `JSL: Open Interactive SmartLog` (Ctrl+Shift+P)
   - Or click JSL icon in activity bar

4. **git-branchless will auto-initialize** in your repository

## Usage

### Opening JSL

- **Command Palette**: `JSL: Open Interactive SmartLog`
- **Activity Bar**: Click JSL icon
- **Auto-open**: Enable in settings

### Basic Workflow

1. **View Commits**: See your feature branches and stacks
2. **Click Commits**: View details and file changes
3. **Create Commits**: Use the commit form in JSL
4. **Rebase**: Drag-drop commits or use context menu
5. **Switch Commits**: Click "Goto" button on any commit

### Settings

- `jsl.gitCommand`: Path to git executable (default: "git")
- `jsl.gitBranchlessCommand`: Path to git-branchless (default: "git-branchless")
- `jsl.autoOpen`: Auto-open JSL when opening repo (default: false)
- `jsl.serverPort`: Server port (0 = random, default: 0)
- `jsl.useWatchman`: Use Watchman for file watching (default: true)

## Troubleshooting

### "Missing required dependencies"

Run command: `JSL: Check Dependencies`

This will show which dependencies are missing and provide installation links.

### Server fails to start

Check VSCode output panel (View → Output → select "JSL")

Common issues:
- git-branchless not installed
- Node.js version too old
- Port already in use

### No commits showing

1. Verify you're in a git repository: `git status`
2. Run `git branchless init` in your repository
3. Reload VSCode window
4. Try command: `JSL: Refresh`

## Development

See [Development Guide](../DEVELOPMENT.md) for contributing to JSL.

### Building the Extension

```bash
cd jsl-vscode
npm install
npm run build
npm run package
```

### Testing

```bash
# Open extension development host
code --extensionDevelopmentPath=/path/to/jsl/jsl-vscode
```

Or press F5 in VSCode with jsl-vscode folder open.

## License

MIT (inherited from Sapling ISL)

## Acknowledgments

Built on:
- [Sapling ISL](https://github.com/facebook/sapling) by Meta
- [git-branchless](https://github.com/arxanas/git-branchless)

