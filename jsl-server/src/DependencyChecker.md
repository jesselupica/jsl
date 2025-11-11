# Dependency Checker Module

## Purpose

Validates that all required external dependencies (git, git-branchless, watchman) are installed and accessible. This is critical for VSCode extension deployment where we cannot bundle native binaries.

## Dependencies

### Required

**git**
- Minimum version: 2.30+
- Used for: All git operations
- Install: Platform package managers or https://git-scm.com/downloads

**git-branchless**
- Minimum version: 0.7.0+
- Used for: Smartlog visualization, stack management, rebasing
- Install: 
  - macOS: `brew install git-branchless`
  - Linux: `cargo install --locked git-branchless`
  - Windows: Download from GitHub releases
- After install: Run `git branchless init` in each repository

### Optional

**watchman**
- Used for: Efficient file watching
- Fallback: Polling (slower but works)
- Install:
  - macOS: `brew install watchman`
  - Linux/Windows: See https://facebook.github.io/watchman/docs/install.html

## Usage

### At Server Startup

```typescript
import {validateRequiredDependencies} from './DependencyChecker';

// Validate before starting server
try {
  await validateRequiredDependencies(logger);
  // All required deps installed, proceed
} catch (error) {
  // Show error to user with installation instructions
  console.error(error.message);
  process.exit(1);
}
```

### For UI Display

```typescript
import {getDependencyStatusForUI} from './DependencyChecker';

// Get status for settings panel
const status = await getDependencyStatusForUI();

if (!status.ready) {
  // Show installation instructions in UI
  status.dependencies
    .filter(d => d.required && !d.installed)
    .forEach(dep => {
      showError(`Missing: ${dep.name}`, dep.installUrl);
    });
}
```

### Manual Check

```typescript
import {checkDependencies} from './DependencyChecker';

const result = await checkDependencies(logger);

console.log('All required installed:', result.allRequired);
console.log('Missing:', result.missingRequired.map(d => d.name));
```

## VSCode Extension Integration

### Extension Activation

```typescript
// extension.ts
import {checkDependencies} from './DependencyChecker';

export async function activate(context: vscode.ExtensionContext) {
  const depCheck = await checkDependencies();
  
  if (!depCheck.allRequired) {
    // Show notification with action buttons
    const missing = depCheck.missingRequired.map(d => d.name).join(', ');
    const action = await vscode.window.showErrorMessage(
      `JSL requires ${missing}. Would you like to see installation instructions?`,
      'View Instructions',
      'Dismiss'
    );
    
    if (action === 'View Instructions') {
      // Show webview or open URL with instructions
      for (const dep of depCheck.missingRequired) {
        if (dep.installUrl) {
          vscode.env.openExternal(vscode.Uri.parse(dep.installUrl));
        }
      }
    }
    
    return; // Don't activate extension
  }
  
  // All deps ready, proceed with activation
}
```

### Settings Panel

Show dependency status in JSL settings:

```typescript
const status = await getDependencyStatusForUI();

return `
Dependencies:
${status.dependencies.map(d => 
  `${d.installed ? '✓' : '✗'} ${d.name} ${d.version || '(not installed)'} ${d.required ? '(required)' : '(optional)'}`
).join('\n')}
`;
```

### Status Bar

```typescript
if (!depCheck.allRequired) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  statusBarItem.text = '$(warning) JSL: Missing Dependencies';
  statusBarItem.command = 'jsl.showDependencies';
  statusBarItem.show();
}
```

## Error Messages

### User-Friendly Messages

When a dependency is missing, we provide:
1. **What's missing**: Clear name
2. **Why it's needed**: Purpose explanation
3. **How to install**: Platform-specific commands
4. **What happens without it**: For optional dependencies

### Example Error

```
JSL is missing required dependencies:

git-branchless:
JSL requires git-branchless for smartlog and stack management.

Install via:
  macOS:    brew install git-branchless
  Linux:    cargo install --locked git-branchless
  Windows:  See https://github.com/arxanas/git-branchless/releases

After installation, run: git branchless init
```

## Future Enhancements

### Auto-Installation (Future)

For some platforms, we could offer to install:

```typescript
const action = await vscode.window.showErrorMessage(
  'git-branchless is not installed',
  'Install via Homebrew',
  'View Manual Instructions'
);

if (action === 'Install via Homebrew') {
  const terminal = vscode.window.createTerminal('Install git-branchless');
  terminal.show();
  terminal.sendText('brew install git-branchless');
}
```

### Version Checking

Check minimum versions:

```typescript
function meetsMinimumVersion(version: string, minimum: string): boolean {
  const v = version.split('.').map(Number);
  const m = minimum.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (v[i] > m[i]) return true;
    if (v[i] < m[i]) return false;
  }
  return true;
}

if (gitBranchless.installed && gitBranchless.version) {
  if (!meetsMinimumVersion(gitBranchless.version, '0.7.0')) {
    throw new Error(`git-branchless ${gitBranchless.version} is too old. Need 0.7.0+`);
  }
}
```

### Repository-Specific Checks

Check if git-branchless is initialized in the repo:

```typescript
async function isGitBranchlessInitialized(repoRoot: string): Promise<boolean> {
  try {
    execSync('git config branchless.mainBranch', {
      cwd: repoRoot,
      encoding: 'utf-8',
    });
    return true;
  } catch {
    return false;
  }
}
```

## Testing

### Mock for Tests

```typescript
// __tests__/DependencyChecker.test.ts
jest.mock('child_process', () => ({
  execSync: jest.fn((cmd) => {
    if (cmd.includes('git branchless')) {
      return 'git-branchless 0.7.1';
    }
    throw new Error('Command not found');
  }),
}));
```

### Manual Testing

```bash
# Simulate missing git-branchless
export PATH=/usr/bin:/bin  # Remove Homebrew from PATH
npm run serve

# Should show clear error message
```

