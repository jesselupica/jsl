# JSL Testing & Next Steps

## ✅ Build Success!

We've successfully:
1. ✅ Installed all dependencies  
2. ✅ Fixed import references (isl → jsl-client, isl-server → jsl-server)
3. ✅ Fixed rollup configuration for server
4. ✅ Fixed vite configuration for client
5. ✅ Server builds successfully (`npm run build:server`)
6. ✅ Client builds successfully (`npm run build:client`)

## 🚀 How to Run JSL

### Terminal 1 - Start the Server

```bash
cd /Users/jesselupica/Projects/jsl/jsl-server
npm run serve -- --cwd /Users/jesselupica/Projects/jsl
```

This will:
- Start the JSL server
- Open a browser window automatically
- Show the URL with auth token
- Default port: 3001

### Terminal 2 - Start the Client (Development Mode)

For development with hot reload:

```bash
cd /Users/jesselupica/Projects/jsl/jsl-client
npm start
```

This will:
- Start Vite dev server on port 3000
- Enable hot module reload
- Open http://localhost:3000

**Note**: In dev mode, you need both the server (3001) and client (3000) running.

### Using Production Build

If you want to use the production build:

```bash
# Just run the server (it serves the built client)
cd /Users/jesselupica/Projects/jsl/jsl-server
npm run serve -- --cwd /Users/jesselupica/Projects/jsl
# Open the URL it prints (will be http://localhost:3001/?token=...)
```

## 🧪 Testing Checklist

### Initial Smoke Test

1. **Start the server** (Terminal 1)
   ```bash
   cd jsl-server && npm run serve
   ```
   - [ ] Server starts without crashing
   - [ ] Prints URL with token
   - [ ] No immediate errors in console

2. **Start the client** (Terminal 2)
   ```bash
   cd jsl-client && npm start
   ```
   - [ ] Vite starts on port 3000
   - [ ] No compile errors
   - [ ] Opens browser automatically

3. **Check browser**
   - [ ] Page loads (not blank)
   - [ ] No console errors (some warnings OK)
   - [ ] UI appears (even if not fully functional)

### Repository Detection

- [ ] JSL detects it's in a git repository
- [ ] Shows repository name/path
- [ ] No errors about "not a git repo"

### Commit Visualization

- [ ] Some commits appear in the graph
- [ ] Commit messages are visible
- [ ] Graph structure makes sense
- [ ] "You are here" indicator shows

### Uncommitted Changes

- [ ] Shows modified files (if any)
- [ ] File status indicators work (M, A, D)
- [ ] Can see file paths

### Basic Operations

Try these if the above works:

- [ ] Click on a commit to view details
- [ ] View file changes for a commit
- [ ] Create a new commit (if you have changes)
- [ ] Checkout a different commit

## 🐛 Expected Issues

### Will Likely Not Work Yet

1. **git-branchless commands** - GitBranchlessAdapter needs testing
   - Smartlog might fail
   - Rebase operations need work
   - Output transformation incomplete

2. **Drag-and-drop** - Needs testing and possible fixes

3. **GraphQL schema** - May have type mismatches

4. **Some UI features** - Sapling-specific things to remove/adapt

### Known Warnings (OK to Ignore)

- StyleX version mismatch warnings (we used --legacy-peer-deps)
- Deprecated package warnings
- Some audit warnings

## 🔧 If Things Don't Work

### Server won't start

```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill it if needed
kill -9 <PID>

# Try different port
npm run serve -- --port 3002
```

### Client won't connect to server

1. Make sure server is running first
2. Check browser console for WebSocket errors
3. Check that server printed a token
4. Try production mode instead (server serves client)

### "git branchless not found" error

```bash
# Install git-branchless
brew install git-branchless

# Verify
git branchless --version
```

### Repository not detected

```bash
# Make sure you're in a git repo
git status

# Point JSL at a different repo
npm run serve -- --cwd /path/to/your/repo
```

## 📝 Debugging Tips

### Server Logs

The server prints logs to:
- stdout (if you used `--stdout`)
- Or a temp file (path shown on startup)

Watch for:
- Command execution logs
- Git command failures
- Translation errors

### Client Console

Open browser DevTools (F12):
- Check Console tab for errors
- Check Network tab for failed requests
- Check WebSocket frames in Network tab

### Common Error Messages

**"command git not found"**
→ Git not in PATH, set GIT_CMD env var

**"ECONNREFUSED"**
→ Server not running or wrong port

**"Invalid token"**
→ Using wrong URL, get fresh URL from server

## 🎯 Next Development Tasks

Once basic functionality works:

1. **Complete GitBranchlessAdapter** transformations
   - Test each command translation
   - Implement output transformers
   - Handle error cases

2. **Fix GraphQL Schema** mismatches
   - Update types for git vs Sapling
   - Test subscriptions

3. **Remove Sapling UI** elements
   - Evolution/obsolescence UI
   - Commit cloud features
   - Phabricator integration

4. **Test Operations**
   - Commit/amend
   - Rebase
   - Branch operations
   - Conflict resolution

5. **GitHub Integration** (stubbed now)
   - Implement PR creation
   - PR status display
   - Comment integration

## 📚 Reference

- **Architecture**: `.context/architecture.md`
- **Git-branchless**: `.context/git-branchless-integration.md`
- **Differences from ISL**: `.context/sapling-differences.md`
- **Development Guide**: `DEVELOPMENT.md`
- **Overall Status**: `STATUS.md`

## 🆘 Getting Help

If you're stuck:

1. Check browser console for errors
2. Check server logs for git command issues
3. Look at `.context/` docs for architecture
4. Check `module.md` in relevant directories
5. Search for error messages in the code

## ✨ Success Criteria

JSL MVP is working when:
- ✅ Builds complete without errors
- ✅ Server starts and runs
- ✅ Client loads in browser
- ✅ Detects git repository
- ✅ Shows commit graph
- ✅ Shows uncommitted changes
- ✅ Can create commits
- ✅ Can checkout commits
- ✅ Basic rebase works

We're at ~40-50% of MVP completion now that builds work!

