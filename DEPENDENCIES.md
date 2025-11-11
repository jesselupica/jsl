# JSL Dependencies

## Overview

JSL requires external tools to function. These cannot be bundled with the application and must be installed separately by the user.

## Required Dependencies

### 1. Git

**Version**: 2.30 or higher
**Purpose**: Core version control operations

**Installation**:

**macOS**:
```bash
# Via Homebrew
brew install git

# Or download from
# https://git-scm.com/downloads
```

**Linux**:
```bash
# Debian/Ubuntu
sudo apt-get install git

# Fedora
sudo dnf install git

# Arch
sudo pacman -S git
```

**Windows**:
```bash
# Download installer from
# https://git-scm.com/downloads
```

**Verify Installation**:
```bash
git --version
# Should output: git version 2.30.0 or higher
```

### 2. git-branchless

**Version**: 0.7.0 or higher
**Purpose**: Smartlog visualization, stack management, advanced rebasing

**Why Required**: 
- JSL uses `git branchless smartlog` to generate the commit graph
- Stack-aware rebasing for feature branch workflows
- This is the core differentiator from standard git UIs

**Installation**:

**macOS**:
```bash
brew install git-branchless
```

**Linux**:
```bash
# Via cargo (Rust package manager)
cargo install --locked git-branchless

# Or download binary from GitHub releases
# https://github.com/arxanas/git-branchless/releases
```

**Windows**:
```bash
# Download binary from GitHub releases
# https://github.com/arxanas/git-branchless/releases

# Or via cargo
cargo install --locked git-branchless
```

**Verify Installation**:
```bash
git branchless --version
# Should output: git-branchless 0.7.0 or higher
```

**Initialize in Your Repository**:
```bash
cd /path/to/your/repo
git branchless init

# This sets up:
# - Git hooks for tracking
# - Main branch detection
# - Event log for undo support
```

## Optional Dependencies

### 3. Watchman

**Version**: Any recent version
**Purpose**: Efficient file system watching for real-time updates

**Fallback**: JSL will use polling if Watchman is not available (slower but works)

**Installation**:

**macOS**:
```bash
brew install watchman
```

**Linux/Windows**:
See https://facebook.github.io/watchman/docs/install.html

**Verify Installation**:
```bash
watchman --version
```

**Configuration**:
Create `.watchmanconfig` in your repository root:
```json
{}
```

## Dependency Validation

### Automatic Checking

JSL automatically checks for dependencies on startup:

```bash
npm run serve
```

If required dependencies are missing, you'll see:

```
JSL is missing required dependencies:

git-branchless:
JSL requires git-branchless for smartlog and stack management.

Install via:
  macOS:    brew install git-branchless
  ...
```

### Manual Validation

You can check dependencies manually:

```bash
# Check git
git --version

# Check git-branchless
git branchless --version

# Check watchman (optional)
watchman --version
```

## For VSCode Extension Users

### First-Time Setup

When you install the JSL VSCode extension:

1. **Extension activates** and checks dependencies
2. **If missing**: Shows notification with installation links
3. **After installing**: Reload VSCode window
4. **First use**: Run `git branchless init` in your repository

### Installation Workflow

```
Install JSL Extension
  ↓
Extension checks dependencies
  ↓
Missing git-branchless?
  ↓
Shows error notification
  ↓
Click "View Instructions"
  ↓
Opens installation guide
  ↓
User installs git-branchless
  ↓
Reload VSCode
  ↓
Extension activates successfully
  ↓
JSL panel opens
  ↓
Shows "Run git branchless init" if needed
  ↓
User runs init
  ↓
JSL fully functional
```

### Per-Repository Setup

Each git repository needs git-branchless initialized:

```bash
cd /path/to/repo
git branchless init
```

This is a one-time setup per repository. JSL can detect if it's not initialized and prompt you.

## Troubleshooting

### "git-branchless is not a git command"

**Problem**: git-branchless not installed or not on PATH

**Solution**:
```bash
# Install
brew install git-branchless  # macOS

# Verify it's on PATH
which git-branchless
# Should output: /usr/local/bin/git-branchless (or similar)

# Check git can find it
git branchless --version
```

### "command not found: git"

**Problem**: Git not installed or not on PATH

**Solution**:
```bash
# Install git
brew install git  # macOS

# Or download from https://git-scm.com/downloads

# Verify
git --version
```

### "Watchman was not found"

**Problem**: Watchman not installed (optional)

**Solution**: This is a warning, not an error. JSL will work without Watchman, just slower. To install:
```bash
brew install watchman  # macOS
```

### git-branchless installed but still not working

**Problem**: Not on PATH or VSCode can't find it

**Solution**:
```bash
# Find where it's installed
which git-branchless

# Add to VSCode settings.json
{
  "jsl.gitBranchlessPath": "/usr/local/bin/git-branchless"
}
```

## Platform-Specific Notes

### macOS

- Use Homebrew for easiest installation
- Both git and git-branchless available via brew
- Watchman also available via brew

### Linux

- git-branchless requires Rust toolchain (cargo) or manual binary download
- Most distros have git in package manager
- Watchman may need manual compilation

### Windows

- git available via Git for Windows installer
- git-branchless requires cargo or manual binary download
- Watchman support is limited

## Development vs Production

### Development (npm run serve)

Dependencies checked on server startup. Clear error messages in terminal.

### VSCode Extension

Dependencies checked on extension activation. UI notifications guide installation.

### CI/CD

For automated testing:
```bash
# Install all dependencies
brew install git git-branchless watchman  # macOS

# Verify
git --version && git branchless --version
```

## Dependency Management Philosophy

**Why not bundle?**
- Native binaries can't be bundled in Node.js/VSCode extensions
- Platform-specific compilation required
- Users likely already have git installed
- git-branchless updates independently

**Why not optional?**
- git-branchless is core to JSL's value proposition
- Without it, JSL is just a worse version of other git UIs
- Better to require it and provide clear installation steps

**Why check at runtime?**
- Users may install after extension installation
- Provides opportunity to guide installation
- Can detect version mismatches

## Future: Dependency Installation Helper

Potential future feature for VSCode extension:

```typescript
// Detect platform and offer installation
if (process.platform === 'darwin') {
  const action = await vscode.window.showErrorMessage(
    'git-branchless is required but not installed',
    'Install via Homebrew',
    'Manual Instructions'
  );
  
  if (action === 'Install via Homebrew') {
    const terminal = vscode.window.createTerminal('Install git-branchless');
    terminal.sendText('brew install git-branchless && git branchless init');
    terminal.show();
  }
}
```

This could significantly improve first-time user experience.

