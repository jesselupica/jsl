# JSL Complete Feature Test Plan

## Quick Start

```bash
# 1. Restart server with all fixes
cd /Users/jesselupica/Projects/jsl/jsl-server
npm run serve -- --cwd /Users/jesselupica/Projects/jsl --stdout

# 2. Open browser to the URL shown (something like):
# http://localhost:3001/?token=...&cwd=...

# 3. Follow tests below
```

## Feature Tests

### Test 1: Commits Display ✅
**What to check**:
- [ ] Do you see a vertical tree of commits?
- [ ] Do commit messages appear?
- [ ] Are there branch badges (like "main", "test1")?
- [ ] Do you see "You are here" indicator?

**Expected**: Graph shows all JSL commits with proper metadata

---

### Test 2: Uncommitted Changes ✅
**Setup**:
```bash
echo "# Test change" >> README.md
```

**What to check**:
- [ ] "Uncommitted Changes" section appears
- [ ] README.md is listed
- [ ] Shows "M" (modified) indicator
- [ ] File path is clickable

**Expected**: Modified file appears in uncommitted changes section

---

### Test 3: Commit Details & Files ✅
**What to do**:
- Click on any commit in the graph

**What to check**:
- [ ] Sidebar opens on right
- [ ] Shows commit hash
- [ ] Shows commit message
- [ ] "Files Changed" section shows files
- [ ] File count badge shows number (not 0)
- [ ] Each file has status indicator (A/M/R)

**Expected**: Sidebar shows full commit details with all changed files

---

### Test 4: Create a Commit ✅
**What to do**:
1. Make sure you have uncommitted changes (from Test 2)
2. Type a commit message in the text box
3. Click "Commit" button

**What to check**:
- [ ] New commit appears in graph
- [ ] Uncommitted changes section clears
- [ ] "You are here" moves to new commit
- [ ] Branch badge moves to new commit

**Expected**: New commit created and appears immediately

---

### Test 5: Checkout Different Commit ✅
**What to do**:
1. Hover over an older commit
2. Click "Goto" button

**What to check**:
- [ ] "You are here" indicator moves
- [ ] Working directory updates (run `git status` in terminal)
- [ ] Branch badge stays on tip of branch

**Expected**: Can navigate to any commit

---

### Test 6: Create a Branch ✅
**What to do**:
1. Right-click on any commit
2. Select "Create Bookmark..."
3. Enter a branch name (e.g., "feature-test")
4. Click OK

**What to check**:
- [ ] New branch badge appears on commit
- [ ] Branch is created (verify: `git branch`)
- [ ] Can checkout the branch

**Expected**: New branch created at selected commit

---

### Test 7: Move a Branch (Drag Branch Badge) ✅
**What to do**:
1. Find a commit with a branch badge
2. Drag the branch name badge
3. Drop it on a different commit

**What to check**:
- [ ] Branch badge moves to new commit
- [ ] Git branch pointer updated (verify: `git log --all`)

**Expected**: Branch pointer moves to new commit

---

### Test 8: Rebase Operation ✅
**What to do**:
1. Have commits on a feature branch
2. Drag a commit onto a different base
3. Confirm the rebase

**What to check**:
- [ ] Commits move in graph
- [ ] Git history updates
- [ ] Branch follows commits

**Expected**: Stack rebases onto new base

---

## Known Working State

Based on implementation, these should all work:

### Data Display
- ✅ git status → uncommitted changes
- ✅ git log → commit graph
- ✅ git show → file changes
- ✅ Branch names on commits
- ✅ File counts on commits
- ✅ HEAD indicator

### Operations
- ✅ git checkout → goto commit
- ✅ git commit → create commit
- ✅ git commit --amend → amend commit
- ✅ git branch → create branch
- ✅ git branch -f → move branch
- ✅ git rebase → rebase stack (via git-branchless)

## Browser Console Check

Open DevTools (F12) → Console

**Should NOT see**:
- ❌ "Connection lost" errors
- ❌ GraphQL errors
- ❌ Module not found errors
- ❌ Parsing errors

**OK to see**:
- ✅ Info messages
- ✅ Analytics tracking
- ✅ Debug logs

## Server Terminal Check

**Should see**:
- ✅ `✓ git-branchless initialized`
- ✅ `run command: git status --porcelain=v2`
- ✅ `run command: git log --all`
- ✅ `[track] StatusCommand`
- ✅ `[track] LogCommand`

**Should NOT see**:
- ❌ Template parsing errors
- ❌ "No commits found"
- ❌ ENOENT errors
- ❌ Command crashes

## If Things Don't Work

### Commits Not Showing

**Debug**:
```bash
# In server terminal, look for:
git log --all --format=...

# Manually run it to see output:
cd /Users/jesselupica/Projects/jsl
git log --all --format='%H%n%s' -5
```

**Fix**: May need to adjust git format string in `createGitFormatForIslTemplate()`

### Uncommitted Changes Not Showing

**Debug**:
```bash
# Check git status output:
git status --porcelain=v2

# Verify transformation:
# Look in server logs for the JSON output
```

**Fix**: Check `transformGitStatusToJson()` parsing logic

### Files Not Showing in Commit Details

**Debug**:
```bash
# Check git show output:
git show --name-status --format=%H HEAD

# Should show:
# <hash>
# M	file.txt
# A	newfile.txt
```

**Fix**: Check `transformGitShowToChangedFilesFormat()` parsing

### Branches Not Showing

**Debug**:
```bash
# Check what %D outputs:
git log -1 --format='%D'

# Should show: HEAD -> branch, other-branch
```

**Fix**: Check `parseGitRefs()` logic

## Success Criteria

JSL is fully working when:

**Visual**:
- ✅ Commits appear in graph
- ✅ "You are here" shows on HEAD
- ✅ Branch badges visible
- ✅ File counts show numbers
- ✅ Uncommitted changes listed

**Interactive**:
- ✅ Can click commits
- ✅ Can create commits
- ✅ Can create branches
- ✅ Can move branches
- ✅ Can checkout commits

**Stable**:
- ✅ No crashes
- ✅ No errors in console
- ✅ Updates in real-time
- ✅ Operations complete successfully

## Final Validation Commands

Run these to verify everything:

```bash
# 1. Make a change
echo "test" >> README.md

# 2. Check JSL shows it

# 3. Commit it in JSL UI

# 4. Verify commit appears:
git log -1

# 5. Create a branch in JSL UI

# 6. Verify branch exists:
git branch

# 7. Move branch in JSL UI (drag badge)

# 8. Verify branch moved:
git log --all --oneline --graph
```

If all 8 steps work, JSL is fully functional! 🎉

