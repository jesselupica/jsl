# Git-Branchless Integration

## Overview

JSL uses [git-branchless](https://github.com/arxanas/git-branchless) for advanced git operations and stack management. Git-branchless provides features similar to Sapling's stack-based workflow in a git-native way.

## Why git-branchless?

### Advantages
1. **Smartlog**: Visual tree of relevant commits (like Sapling)
2. **Stack Management**: Rebase entire stacks atomically
3. **Move Operations**: Easily move commits around
4. **Hide/Unhide**: Manage commit visibility
5. **Sync**: Keep stacks up-to-date with main
6. **Git-Native**: Works with standard git repositories

### Alternative Considered
- **Pure git**: Lacks smartlog, stack awareness
- **git-machete**: Similar but different data model
- **Graphite CLI**: Commercial, not open source

## Installation

### User Installation Required

```bash
# macOS via Homebrew
brew install git-branchless

# Linux via cargo
cargo install --locked git-branchless

# Or download binary from releases
# https://github.com/arxanas/git-branchless/releases
```

JSL **requires** git-branchless to be:
1. Installed on system
2. Available on PATH
3. Version 0.7.0 or later

## Command Usage

### Smartlog

**Purpose**: Get tree of commits for visualization

```bash
git branchless smartlog --json
```

**Output** (simplified):
```json
{
  "commits": [
    {
      "oid": "abc123",
      "message": "Add feature",
      "branches": ["feature-branch"],
      "parents": ["def456"]
    }
  ],
  "head": "abc123",
  "main_branch": "main"
}
```

**JSL Usage**:
- Called by `Repository.fetchSmartlogCommits()`
- Transformed to ISL's commit format
- Filters out main branch commits (shown as reference only)

### Rebase

**Purpose**: Rebase commit and its descendants

```bash
git branchless rebase --onto <destination> <source>
```

**JSL Usage**:
- Drag-drop commits
- Move branches
- Update stacks after main advances

**Benefits over git rebase**:
- Automatically rebases descendant commits
- Preserves branch pointers
- Better conflict handling

### Move

**Purpose**: Move commits without changing branch

```bash
git branchless move -s <source> -d <destination>
```

**JSL Usage**:
- Rearrange commits in stack
- Insert commits between others

### Sync

**Purpose**: Update all branches with latest main

```bash
git branchless sync
```

**JSL Usage** (future):
- "Sync all" button
- Automatic sync on pull

### Hide/Unhide

**Purpose**: Mark commits as obsolete without deleting

```bash
git branchless hide <commit>
git branchless unhide <commit>
```

**JSL Usage** (future):
- "Archive" branches
- Clean up smartlog view

## Data Model

### Concepts

**Stack**: Series of commits built on each other
```
main
 ├─ feature-1
 │   └─ feature-1-improvement
 └─ feature-2
```

**Tree**: DAG of commits and their relationships
```
Each commit knows:
- Parents (commit history)
- Children (what's built on top)
- Branches pointing to it
```

### Metadata Storage

Git-branchless stores metadata in:
- `.git/branchless/` directory
- Refs: `.git/refs/branchless/`
- Config: `.git/config` (branchless.* sections)

**What's stored**:
- Hidden commits
- Event history (for undo)
- Restack information

## Translation Layer

### GitBranchlessAdapter Responsibilities

1. **Command Translation**
   ```typescript
   translateCommand(['log', '--rev', 'smartlog()'])
   // → {command: 'git', args: ['branchless', 'smartlog', '--json']}
   ```

2. **Output Transformation**
   ```typescript
   // git-branchless JSON → ISL format
   transformGitBranchlessSmartlogToIslFormat(output)
   ```

3. **Error Handling**
   ```typescript
   // Detect git-branchless not installed
   // Fallback to pure git where possible
   ```

### Format Conversions

**Commit Hash**:
- git-branchless: `oid`
- ISL: `hash`

**Branches**:
- git-branchless: `branches: ["name"]`
- ISL: `bookmarks: [{value: "name", type: "local"}]`

**Parents**:
- git-branchless: `parents: ["hash1", "hash2"]` (merge has 2+)
- ISL: `parents: ["hash1"]` (no merges in feature workflow)

**Commit Message**:
- git-branchless: Full message in `message` field
- ISL: Split into `title` (first line) and `description` (rest)

## Operation Mapping

### ISL Operation → git-branchless Command

| ISL Operation | Git-Branchless Command |
|--------------|------------------------|
| Rebase | `git branchless rebase --onto <dest>` |
| Goto | `git checkout` (not branchless) |
| Histedit | `git branchless rebase -i` |
| Restack | `git branchless rebase --on-disk` |
| Hide | `git branchless hide` |

### Drag-Drop Mappings

**Move Branch to Commit**:
```bash
git branch -f <branch-name> <commit-hash>
```

**Move Commit to Different Parent**:
```bash
git branchless move -s <commit> -d <new-parent>
```

**Reorder Commits in Stack**:
```bash
git branchless rebase -i <base>
# Edit plan to reorder
```

## Error Handling

### git-branchless Not Found

```typescript
try {
  await ejeca('git', ['branchless', 'smartlog']);
} catch (err) {
  if (err.code === 'ENOENT' || err.message.includes('not a git command')) {
    throw new Error(
      'git-branchless is not installed. ' +
      'Install from: https://github.com/arxanas/git-branchless'
    );
  }
}
```

### git-branchless Not Initialized

```bash
# Error: "run `git branchless init` first"

# JSL should automatically run:
git branchless init
```

### Conflicts

git-branchless detects conflicts same as git:
- Exit code 1
- Conflicted files marked
- Rebase paused

JSL handles via existing conflict UI.

## Configuration

### Repository Setup

First time in a repository:
```bash
# User or JSL runs:
git branchless init

# Sets up:
# - Hook installation
# - Main branch detection
# - Event log initialization
```

### JSL Configuration

**Check if available**:
```typescript
async function isGitBranchlessAvailable(): Promise<boolean> {
  try {
    await ejeca('git', ['branchless', '--version']);
    return true;
  } catch {
    return false;
  }
}
```

**Get version**:
```typescript
const {stdout} = await ejeca('git', ['branchless', '--version']);
// "git-branchless 0.7.1"
const version = stdout.match(/\d+\.\d+\.\d+/)?.[0];
```

### User Configuration

Users can configure git-branchless via:
```bash
git config branchless.mainBranch main
git config branchless.navigation.autoSwitchBranches true
```

JSL respects these settings when executing commands.

## Performance Considerations

### Smartlog Performance

**Fast**: git-branchless is optimized
- ~50ms for typical repo
- ~200ms for large repo (1000s of commits)
- Caches internally

**Optimization**:
```bash
# Limit smartlog output
git branchless smartlog --json --commits 100
```

### Rebase Performance

**Depends on**:
- Number of commits in stack
- Complexity of changes
- Merge conflicts

**Typical**: 1-2 seconds for 10-commit stack

## Testing

### Manual Testing

```bash
# Setup test repo
git init test-repo && cd test-repo
git branchless init

# Create stack
git commit --allow-empty -m "main"
git checkout -b feature-1
git commit --allow-empty -m "f1"
git checkout -b feature-2
git commit --allow-empty -m "f2"

# Test smartlog
git branchless smartlog --json

# Test rebase
git branchless rebase main
```

### Integration Tests

JSL includes tests that:
- Mock git-branchless output
- Test command translation
- Verify format conversion
- Handle error cases

## Future Enhancements

### Phase 1 (Current)
- [x] Smartlog for visualization
- [x] Basic rebase operations
- [x] Command translation layer

### Phase 2 (Near-term)
- [ ] git branchless move for drag-drop
- [ ] git branchless sync for updating stacks
- [ ] Automatic conflict detection
- [ ] Progress reporting

### Phase 3 (Future)
- [ ] git branchless hide/unhide UI
- [ ] git branchless undo support
- [ ] Advanced stack operations
- [ ] Custom aliases

## Troubleshooting

### "git branchless is not installed"
→ Install git-branchless (see Installation above)

### "run git branchless init first"
→ JSL should auto-run, or manually run:
```bash
cd /path/to/repo
git branchless init
```

### Smartlog shows no commits
→ Check main branch is configured:
```bash
git config branchless.mainBranch
# Should output "main" or "master"
```

### Operations hang
→ Check git-branchless version:
```bash
git branchless --version
# Should be 0.7.0+
```

## Resources

- [git-branchless Documentation](https://github.com/arxanas/git-branchless/wiki)
- [git-branchless Tutorial](https://github.com/arxanas/git-branchless/wiki/Tutorial)
- [JSL GitBranchlessAdapter Source](../jsl-server/src/GitBranchlessAdapter.ts)

