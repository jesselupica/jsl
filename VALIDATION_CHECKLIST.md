# JSL Validation Checklist

## Pre-Flight Checks

### Dependencies
- [x] git-branchless installed (`git branchless --version`)
- [x] Server builds (`npm run build:server`)
- [x] Client builds (`npm run build:client`)
- [x] git-branchless auto-initializes on first run

### Server Startup
- [x] Server starts without crashing
- [x] Detects git-branchless correctly
- [x] Initializes git-branchless automatically
- [x] Connects to git repository
- [ ] No fatal errors in terminal

## Core Functionality Tests

### 1. Commit Visualization
**Test**: Open JSL and look at the commit graph

**Expected**:
- [ ] Commits appear in the graph
- [ ] Commit messages are visible
- [ ] "You are here" indicator shows on current commit (HEAD)
- [ ] Branch names appear on commits (tags/badges)
- [ ] Graph shows commit relationships (parent/child)

**How to Test**:
1. Open http://localhost:3001/?token=...
2. Look for commit graph in main area
3. Verify latest commit "Fix goto command..." appears

### 2. Commit Details
**Test**: Click on a commit

**Expected**:
- [ ] Sidebar opens on the right
- [ ] Shows commit hash
- [ ] Shows commit message
- [ ] Shows author and date
- [ ] Shows list of changed files (if implemented)

**How to Test**:
1. Click any commit in the graph
2. Check sidebar for details

### 3. Uncommitted Changes
**Test**: Make a change to a file

**Expected**:
- [ ] Modified files appear in "Uncommitted Changes" section
- [ ] File status indicator shows (M for modified)
- [ ] File path is displayed

**How to Test**:
```bash
echo "# Test change" >> README.md
```
Then check JSL UI for the change

### 4. Create Commit
**Test**: Commit a change via JSL UI

**Expected**:
- [ ] Can type commit message
- [ ] "Commit" button is clickable
- [ ] After clicking, new commit appears in graph
- [ ] Uncommitted changes section clears

**How to Test**:
1. Make a change (echo "test" >> README.md)
2. Wait for it to appear in UI
3. Type commit message
4. Click "Commit"
5. Verify new commit appears

### 5. Checkout Different Commit
**Test**: Click on a different commit and goto it

**Expected**:
- [ ] "Goto" button appears on hover
- [ ] Clicking moves "You are here" indicator
- [ ] Working directory updates (verify with `git log --oneline -1`)

**How to Test**:
1. Hover over an older commit
2. Click "Goto" button
3. Verify HEAD moved

### 6. Branch Operations
**Test**: Create or switch branches

**Expected**:
- [ ] Can see existing branches in graph
- [ ] Can create new branch
- [ ] Can switch between branches

**How to Test**:
```bash
git checkout -b test-branch
```
Verify it appears in JSL

### 7. Rebase Operation
**Test**: Rebase a commit

**Expected**:
- [ ] Can drag-drop commits (or use rebase menu)
- [ ] Rebase executes
- [ ] Graph updates to show new structure

**How to Test**:
1. Create a feature branch
2. Add commits
3. Try to rebase onto main

## Known Issues (OK for MVP)

### Expected Errors (Can Ignore)
- ⚠️ Watchman not found - Uses polling instead
- ⚠️ debuggitmodules errors - Sapling debug command, not needed
- ⚠️ debugcommitmessage errors - Sapling debug command, not needed
- ⚠️ MaxListenersExceededWarning - Minor performance issue

### Expected Missing Features
- GitHub PR integration (stubbed)
- Evolution/obsolescence UI (removed, git doesn't have this)
- Commit cloud (removed, git doesn't have this)
- Some advanced operations may not work yet

## What Should Definitely Work

- ✅ Server starts and runs
- ✅ Client connects  
- ✅ Repository detected
- ✅ git-branchless auto-initialization
- ✅ git status (without --copies)
- ✅ git log for commits
- ✅ git config reading
- ⏳ Commit graph display
- ⏳ Commit details
- ⏳ Goto/checkout
- ⏳ Creating commits
- ⏳ Basic operations

## Browser Console Check

Open DevTools (F12) → Console tab

**Should NOT see**:
- Connection errors (should stay connected)
- GraphQL subscription errors
- Missing module errors

**OK to see**:
- Some GraphQL warnings
- Analytics tracking messages
- Debug messages

## Terminal Output Check

In server terminal:

**Should see**:
- [LOG] run command: git rev-parse...
- [LOG] run command: git status...
- [LOG] run command: git log...
- [track] StatusCommand
- [track] LogCommand

**Should NOT see**:
- Crash/exit
- ENOENT errors for .git
- "branchless is not a git command"
- Template parsing errors repeatedly

## Performance Check

- [ ] Page loads in < 5 seconds
- [ ] Commit graph renders smoothly
- [ ] Clicking commits responds quickly
- [ ] No lag when typing commit messages

## Next Steps After Validation

If core functionality works:

1. **Test Operations**
   - Create commits
   - Amend commits
   - Checkout commits
   - Create branches

2. **Test Advanced Features**
   - Drag-drop rebasing
   - Stack management
   - Conflict resolution

3. **Polish**
   - Fix any remaining UI issues
   - Improve error messages
   - Add missing features

4. **VSCode Extension**
   - Create extension scaffolding
   - Integrate JSL
   - Package and test

## Success Criteria

**MVP is successful if**:
- ✅ Server runs without crashing
- ✅ Client loads and stays connected
- ⏳ Commits display in graph
- ⏳ Can click commits and see details
- ⏳ Can create a commit via UI
- ⏳ Can checkout different commits
- ⏳ No major errors in console/terminal

## Debugging Tips

**If commits don't appear**:
- Check server logs for git log command output
- Check if git log command succeeded
- Look for parsing errors in templates.ts

**If UI is blank**:
- Check browser console for errors
- Verify WebSocket connection (Network tab)
- Check for JavaScript errors

**If operations fail**:
- Check server logs for git command errors
- Verify command translation is working
- Test git command manually in terminal

