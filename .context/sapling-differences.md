# Differences from Sapling ISL

## Overview

JSL is a fork of Sapling's Interactive SmartLog (ISL), adapted for git workflows. While we've kept most of the UI and architecture, several key changes were necessary.

## Major Differences

### 1. Version Control System

**Sapling ISL**:
- Uses Sapling VCS (`sl` command)
- Mercurial-based with Git compatibility layer
- Designed by Meta for Facebook's monorepo

**JSL**:
- Uses Git (`git` command)
- Uses git-branchless for advanced features
- Standard git repositories

**Impact**: All command execution goes through GitBranchlessAdapter

### 2. Commit Evolution / Obsolescence

**Sapling ISL**:
- Tracks commit evolution (amend history)
- Shows obsolete commits as faded
- "Obsmarkers" link old/new versions
- UI for "fold", "split", etc.

**JSL**:
- Git doesn't have evolution tracking
- Amends create new commits (old ones garbage collected)
- **Removed**: Evolution UI entirely
- **Removed**: Obsolescence markers

**Files Changed**:
- Removed obsolescence rendering logic
- Removed evolution-related GraphQL types
- Removed fold/split operations

### 3. Commit Cloud

**Sapling ISL**:
- Commit Cloud syncs commits across machines
- Background backup
- Status indicators in UI

**JSL**:
- No equivalent feature
- Uses standard git remotes
- **Removed**: Commit Cloud UI and API

**Files Changed**:
- Removed Commit Cloud status checks
- Removed backup indicators
- Removed sync operations

### 4. Bookmarks vs Branches

**Sapling ISL**:
- Uses "bookmarks" (like git branches)
- Active bookmark shown
- Can create/delete/rename

**JSL**:
- Uses git branches
- Same UI, different underlying command
- Terminology kept as "bookmarks" in code (maps to branches)

**Translation**:
```typescript
// Sapling: sl bookmarks
// JSL: git branch
translateCommand(['bookmarks'])
// → {command: 'git', args: ['branch']}
```

### 5. Smartlog Algorithm

**Sapling ISL**:
- Built into Sapling
- Uses revsets: `smartlog()`
- Filters by date and relevance

**JSL**:
- Uses git-branchless smartlog
- Different algorithm but similar results
- Master branch filtered out

**Implementation**:
```typescript
// Sapling: sl log --rev 'smartlog()'
// JSL: git branchless smartlog --json
```

### 6. Code Review Integration

**Sapling ISL**:
- Tight Phabricator integration
- `sl pr` for GitHub (alpha)
- Diff summaries inline

**JSL**:
- **Stubbed**: GitHub integration UI kept but not wired
- **Planned**: Custom GitHub implementation
- **Removed**: Phabricator support

**Current State**:
- "Submit for Code Review" button exists
- Backend returns "not implemented"
- Will be re-implemented in future

### 7. Repository Detection

**Sapling ISL**:
- Looks for `.sl/` directory
- Mercurial `.hg/` for compatibility
- Nested repositories supported

**JSL**:
- Looks for `.git/` directory
- Standard git repository detection
- Single repository per connection

**Translation**:
```typescript
// Sapling: sl root --dotdir
// JSL: git rev-parse --git-dir
```

### 8. Merge Commits

**Sapling ISL**:
- Supports merge commits
- Shows merge arrows
- Merge strategy options

**JSL**:
- **Opinionated**: Rebase-only workflow
- No merge commits in feature branches
- Only main branch has merges (from remote)

**UI Changes**:
- Removed merge strategy options
- Removed octopus merge visualization
- Enforces linear stacks

### 9. Templates and Output Formats

**Sapling ISL**:
- Custom template language
- `-Tjson` for JSON output
- Rich commit metadata

**JSL**:
- Git's `--format` strings
- `--porcelain` formats
- git-branchless JSON
- **Translation**: Convert Sapling templates to git formats

**Example**:
```typescript
// Sapling template: {node|short} {desc}
// Git format: %h %s
convertSaplingTemplateToGitFormat('{node|short} {desc}')
// → '%h %s'
```

### 10. Conflict Resolution

**Sapling ISL**:
- `sl resolve` command
- `--tool` flag for merge tools
- `-Tjson` for conflict data

**JSL**:
- `git diff` to detect conflicts
- `git add` to mark resolved
- Standard git conflict markers

**Translation**:
```typescript
// Sapling: sl resolve --list --all
// JSL: git diff --name-only --diff-filter=U
```

## Minor Differences

### File Status Codes

**Sapling**: `M` (modified), `A` (added), `R` (removed), `C` (copied)
**JSL**: Same codes via `--porcelain` format

### Commit Hashes

**Sapling**: Can use short hashes in revsets
**JSL**: Git also supports short hashes

### Date Formats

**Sapling**: Custom date formats in templates
**JSL**: Git's `--date` flag formats

### Remote Names

**Sapling**: `default` remote (like Mercurial)
**JSL**: `origin` remote (git convention)

## Compatibility Considerations

### What We Kept

1. **UI Design**: Nearly identical look and feel
2. **GraphQL Schema**: Mostly the same types
3. **Operation Model**: Same operation queue system
4. **State Management**: Same Jotai atoms
5. **File Structure**: Same client/server split
6. **Drag-Drop**: Same interactions

### What We Removed

1. **Obsmarkers**: Evolution tracking
2. **Commit Cloud**: Cross-machine sync
3. **Phabricator**: Code review integration
4. **Split/Fold**: Advanced commit editing
5. **Debugcommands**: Sapling debugging tools
6. **Revsets**: Sapling query language

### What We Modified

1. **Command Execution**: Through GitBranchlessAdapter
2. **Smartlog**: Uses git-branchless
3. **Bookmarks**: Maps to git branches
4. **Status**: Uses git status
5. **Blame**: Uses git blame
6. **Cat**: Uses git show

## Code Organization Changes

### New Files

- `jsl-server/src/GitBranchlessAdapter.ts`: Translation layer
- `.context/`: AI-native documentation
- `module.md`: Per-directory docs

### Removed Files

- None yet (kept for reference)
- Will remove Sapling-specific code as we solidify replacements

### Modified Files

Major changes to:
- `commands.ts`: Uses GitBranchlessAdapter
- `Repository.ts`: Git-specific operations
- `ServerToClientAPI.ts`: Defaults to 'git'
- UI components removing obsolescence

## Migration Path for Users

### From Sapling to JSL

Users cannot directly migrate. These are different VCS:
- Sapling uses Mercurial-based storage
- JSL uses Git storage
- Different commit IDs, different history

### From ISL (with Git backend) to JSL

Sapling ISL already supports Git:
- JSL is an alternative implementation
- Same visualizations, different tech stack
- JSL adds git-branchless features

## Future Sapling ISL Updates

### Tracking Upstream

We're NOT tracking Sapling ISL updates because:
1. Fundamentally different VCS backends
2. Diverging feature sets
3. Different dependencies (git-branchless)

### Cherry-Picking Features

We may port features like:
- UI improvements
- Performance optimizations
- Bug fixes
- New visualizations

### Contributing Back

Improvements that could help both:
- React component enhancements
- CSS/styling fixes
- Accessibility improvements
- General bug fixes

## Testing Differences

### Sapling ISL Tests

- Mock `sl` commands
- Test Sapling revsets
- Test evolution features

### JSL Tests

- Mock `git` commands
- Test git-branchless integration
- Test translation layer
- No evolution tests

## Documentation Differences

### Sapling ISL

- Sapling CLI documentation
- Mercurial background
- Facebook-specific features

### JSL

- Git CLI documentation
- git-branchless documentation
- Generic git workflows
- AI-native development docs

## Performance Differences

### Similar

- Both use file watching
- Both cache results
- Both use WebSocket

### Different

- git-branchless smartlog vs Sapling smartlog
- Git pack files vs Mercurial revlog
- Different index formats

## Deployment Differences

### Sapling ISL

- Bundled with `sl` CLI
- Launched via `sl web`
- Integrated with Sapling updates

### JSL

- Standalone npm package
- Launched via `npm run serve`
- Separate from git installation

## Summary

JSL maintains the **spirit** of Sapling ISL while being **git-native**:

**Kept**: Visual design, UI interactions, architecture patterns
**Changed**: Command execution, data formats, VCS integration
**Removed**: Sapling-specific features (evolution, commit cloud)
**Added**: git-branchless integration, AI-native docs

The result: A familiar ISL experience for git users with git-branchless power.

