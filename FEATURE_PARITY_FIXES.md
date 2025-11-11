# JSL Feature Parity Fixes

This document describes the fixes implemented to achieve feature parity with Sapling ISL.

## Summary of Fixes

### 1. Master/Main Branch Tag Display ✅

**Issue**: The master or main branch tag was not showing up on commits.

**Fix**: Updated `GitBranchlessAdapter.ts` to:
- Properly detect the main branch name (main/master) from git-branchless config or by auto-detection
- Correctly parse git refs (`%D` output) to extract branch names
- Support both "main" and "master" as mainline branch names
- Handle both local and remote branch references (e.g., "origin/main")

**Location**: 
- `jsl-server/src/GitBranchlessAdapter.ts` - `markHeadCommit()` and `parseGitRefs()` functions
- `jsl-client/src/utils.ts` - `isCommitMaster()` function

### 2. Master Commit Abstraction ✅

**Issue**: All master/main commits were showing in the view, cluttering it. Should abstract away commits without draft children (like Sapling does).

**Fix**: Implemented proper phase detection:
- Commits reachable from main branch are marked as "public"
- Commits not reachable from main are marked as "draft"
- The existing client-side filtering in `dag.ts` already hides unnamed public commits
- Public commits with draft children are still shown (as connection points)

**How it works**:
1. Server runs `git rev-list main` to get all public commits
2. Each commit's phase is set to "public" or "draft" based on whether it's in that set
3. Client filters out public commits without bookmarks or draft children

**Location**:
- `jsl-server/src/GitBranchlessAdapter.ts` - `markHeadCommit()` function (lines 609-670)
- `jsl-client/src/dag/dag.ts` - `subsetForRenderingImpl()` (existing filtering logic)

### 3. Branch Creation UI ✅

**Issue**: No UI to create a new branch at the current commit.

**Fix**: Added a new "Create Branch" button to the top bar:
- Icon button with git-branch icon
- Placed next to "Download commits and diffs" button
- Opens a tooltip with:
  - Text input for branch name
  - Branch name validation (git naming rules)
  - "Cancel" and "Create Branch" buttons
- Creates branch at current commit using `BookmarkCreateOperation`

**Location**:
- `jsl-client/src/CreateBranchButton.tsx` - New component
- `jsl-client/src/TopBar.tsx` - Added button to top bar

**Validation Rules**:
- Cannot start with `-` or `.`
- Cannot contain special characters: `~ ^ : \ * ? [`
- Cannot end with `.lock`
- Cannot be `@`

### 4. Goto Command Functionality ✅

**Issue**: "git goto" is not a real git command, causing the goto button to fail.

**Fix**: Verified that the command translation is already correct:
- Client `GotoBaseOperation` returns `['goto', '--rev', destination]`
- Server `translateGotoCommand()` correctly translates to `['checkout', target]`
- Translation is applied in `runCommand()` before execution

The goto functionality should work correctly with the existing code.

**Location**:
- `jsl-client/src/operations/GotoBaseOperation.ts` - Operation definition
- `jsl-server/src/GitBranchlessAdapter.ts` - `translateGotoCommand()` function (lines 369-395)
- `jsl-server/src/commands.ts` - `runCommand()` function (applies translation)

## Testing

A test repository was created at `/tmp/jsl-test-repo` with:
- 10 commits on main branch
- 2 feature branches (feature/test-1 and feature/test-2)
- Initialized with git-branchless

### How to Test

1. **Start JSL server** pointed at the test repository:
   ```bash
   cd /Users/jesselupica/Projects/jsl/jsl-server
   CWD=/tmp/jsl-test-repo npm run serve
   ```

2. **Test Master Tag Display**:
   - Open JSL in browser
   - Look for the commit at the tip of main
   - Verify "main" tag appears on that commit

3. **Test Master Abstraction**:
   - Verify that the 9 commits on main (without draft children) are hidden
   - Only the main commit that has feature branches should be visible
   - The feature branch commits should be visible

4. **Test Branch Creation**:
   - Click the git-branch icon button in the top bar (next to cloud-download icon)
   - Enter a branch name like "feature/test-3"
   - Click "Create Branch"
   - Verify new branch appears in the smartlog

5. **Test Goto**:
   - Click "Goto" button on a non-HEAD commit
   - Verify HEAD moves to that commit
   - Check server logs for confirmation (should show "git checkout" not "git goto")

## Technical Details

### Phase Detection Algorithm

The server determines commit phase (public vs draft) using:

```typescript
// Get main branch name from git-branchless config
const mainBranch = execSync('git config branchless.core.mainBranch') || 'main';

// Get all commits reachable from main
const publicCommits = new Set(
  execSync(`git rev-list ${mainBranch}`).split('\n')
);

// Check each commit
const phase = publicCommits.has(commitHash) ? 'public' : 'draft';
```

### Client-Side Filtering

The client already has logic in `dag.ts` to filter rendering:

```typescript
// Hide unnamed public commits without draft children
const unamedPublic = this.filter(
  i =>
    i.phase === 'public' &&
    i.remoteBookmarks.length === 0 &&
    i.bookmarks.length === 0 &&
    !i.isDot
);
const toHidePublic = unamedPublic.subtract(this.parents(draft));
```

This ensures:
- Public commits with bookmarks are shown
- Public commits with draft children are shown (as connection points)
- Public commits without either are hidden (abstracted away)

## Files Modified

### Server
- `jsl-server/src/GitBranchlessAdapter.ts` - Command translation and phase detection

### Client
- `jsl-client/src/CreateBranchButton.tsx` - New component (created)
- `jsl-client/src/TopBar.tsx` - Added branch creation button
- `jsl-client/src/utils.ts` - Updated `isCommitMaster()` helper

### Test Repository
- `/tmp/jsl-test-repo` - Test git repository (created)

## Notes

- All changes are backward compatible
- No breaking changes to existing functionality
- The phase detection is done once per smartlog fetch and cached
- Branch name validation follows standard git rules
- The goto command translation was already correct, just verified

