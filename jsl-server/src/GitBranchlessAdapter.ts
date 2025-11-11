/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * GitBranchlessAdapter
 * 
 * This module translates Sapling (sl) commands to git/git-branchless equivalents.
 * It provides a mapping layer that allows the ISL server code to work with git
 * repositories instead of Sapling repositories.
 */

import type {RepositoryContext} from './serverTypes';

export interface CommandTranslation {
  command: string;
  args: Array<string>;
  // Post-processor to transform output from git format to expected ISL format
  transformOutput?: (output: string) => string;
  // Whether this command uses git-branchless
  usesGitBranchless?: boolean;
}

/**
 * Translates a Sapling command and arguments to git/git-branchless equivalent
 */
export function translateCommand(
  saplingArgs: Array<string>,
  ctx: RepositoryContext,
): CommandTranslation {
  const [subcommand, ...rest] = saplingArgs;

  switch (subcommand) {
    // Repository root commands
    case 'root':
      if (rest.includes('--dotdir')) {
        return {
          command: 'git',
          args: ['rev-parse', '--git-dir'],
        };
      }
      return {
        command: 'git',
        args: ['rev-parse', '--show-toplevel'],
      };

    case 'debugroots':
      // Git doesn't have nested repos in the same way, return single root
      return {
        command: 'git',
        args: ['rev-parse', '--show-toplevel'],
      };

    // Status command
    case 'status':
      return translateStatusCommand(rest);

    // Log/smartlog commands
    case 'log':
      return translateLogCommand(rest, ctx);

    // Checkout/goto command
    case 'goto':
      return translateGotoCommand(rest, ctx);

    // Rebase command
    case 'rebase':
      return {
        command: 'git',
        args: ['branchless', 'rebase', ...rest],
        usesGitBranchless: true,
      };

    // Interactive rebase (histedit in Sapling)
    case 'histedit':
      return {
        command: 'git',
        args: ['branchless', 'rebase', '--interactive', ...rest],
        usesGitBranchless: true,
      };

    // Commit command
    case 'commit':
      return {
        command: 'git',
        args: ['commit', ...rest],
      };

    // Amend command
    case 'amend':
      return {
        command: 'git',
        args: ['commit', '--amend', ...rest],
      };

    // Pull command
    case 'pull':
      return {
        command: 'git',
        args: ['pull', ...rest],
      };

    // Push command
    case 'push':
      return {
        command: 'git',
        args: ['push', '--set-upstream', 'origin', 'HEAD', ...rest],
      };

    // Cat (show file contents at revision)
    case 'cat':
      return translateCatCommand(rest);

    // Blame command
    case 'blame':
      return translateBlameCommand(rest);

    // Diff command
    case 'diff':
      return {
        command: 'git',
        args: ['diff', ...rest],
      };

    // Show command (for viewing commits)
    case 'show':
      return {
        command: 'git',
        args: ['show', ...rest],
      };

    // Bookmarks -> Branches
    case 'bookmarks':
    case 'bookmark':
      return translateBookmarkCommand(rest);

    // Resolve (merge conflict resolution)
    case 'resolve':
      return translateResolveCommand(rest);

    // Config commands
    case 'config':
      return translateConfigCommand(rest, ctx);

    // Smartlog - use git-branchless
    case 'smartlog':
    case 'sl':
      return {
        command: 'git',
        args: ['branchless', 'smartlog', ...rest],
        usesGitBranchless: true,
      };

    // Debug commands - these are Sapling-specific and optional
    case 'debuggitmodules':
      // Return empty result for git submodules query
      return {
        command: 'echo',
        args: ['[]'],  // Empty JSON array
      };

    case 'debugcommitmessage':
      // Return empty commit message template
      return {
        command: 'echo',
        args: [''],  // Empty string
      };

    default:
      ctx.logger.warn(`Untranslated Sapling command: ${subcommand}`);
      // Pass through to git, might work or might fail
      return {
        command: 'git',
        args: saplingArgs,
      };
  }
}

function translateStatusCommand(args: Array<string>): CommandTranslation {
  // Sapling uses -Tjson and --copies, git uses --porcelain=v2
  // Filter out Sapling-specific flags
  const newArgs = args.filter(arg => 
    !arg.startsWith('-Tjson') && 
    arg !== '--copies'
  );
  
  if (args.includes('-Tjson')) {
    return {
      command: 'git',
      args: ['status', '--porcelain=v2', '--untracked-files=all', ...newArgs],
      transformOutput: transformGitStatusToJson,
    };
  }
  
  return {
    command: 'git',
    args: ['status', ...newArgs],
  };
}

function translateLogCommand(args: Array<string>, ctx: RepositoryContext): CommandTranslation {
  // Extract template and revset arguments
  let template = '';
  let revset = '';
  const otherArgs: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--template') {
      template = args[i + 1] || '';
      i++; // Skip next arg
    } else if (args[i] === '--rev' || args[i] === '-r') {
      revset = args[i + 1] || '';
      i++; // Skip next arg
    } else {
      otherArgs.push(args[i]);
    }
  }

  // Special case: Fetching changed files for a commit
  // The template contains file_adds|json which is Sapling-specific
  if (template && (template.includes('file_adds') || template.includes('file_mods') || template.includes('file_dels'))) {
    // Use git show --name-status instead of template
    return {
      command: 'git',
      args: ['show', '--name-status', '--format=%H', revset || 'HEAD'],
      transformOutput: transformGitShowToChangedFilesFormat,
    };
  }

  // For smartlog-style viewing or any log with template
  // Generate git format that matches ISL's expected template output
  if (!revset || revset.includes('smartlog') || revset.includes('stack') || template) {
    // Create a git format string that produces output matching Sapling's template
    // The parseCommitInfoOutput expects lines separated by newlines, ending with COMMIT_END_MARK
    // We need to match the exact format from mainFetchTemplateFields
    const gitFormat = createGitFormatForIslTemplate();
    
    return {
      command: 'git',
      args: ['log', '--all', `--format=${gitFormat}`, '--date-order', ...otherArgs],
      transformOutput: markHeadCommit, // Mark HEAD commit with @
    };
  }

  // For regular log without template, use simple format
  const gitFormat = '%H%x00%P%x00%an%x00%ae%x00%at%x00%s';
  return {
    command: 'git',
    args: ['log', `--format=${gitFormat}`, revset || 'HEAD', ...otherArgs],
  };
}

function translateCatCommand(args: Array<string>): CommandTranslation {
  // sl cat <file> --rev <rev>
  // git show <rev>:<file>
  let file = '';
  let rev = '';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--rev' || args[i] === '-r') {
      rev = args[i + 1] || '';
      i++;
    } else if (!args[i].startsWith('-')) {
      file = args[i];
    }
  }
  
  return {
    command: 'git',
    args: ['show', `${rev || 'HEAD'}:${file}`],
  };
}

function translateBlameCommand(args: Array<string>): CommandTranslation {
  // Filter out Sapling-specific flags
  const newArgs = args.filter(arg => !arg.startsWith('-Tjson'));
  
  if (args.includes('-Tjson')) {
    return {
      command: 'git',
      args: ['blame', '--line-porcelain', ...newArgs],
      transformOutput: transformGitBlameToJson,
    };
  }
  
  return {
    command: 'git',
    args: ['blame', ...newArgs],
  };
}

function translateBookmarkCommand(args: Array<string>): CommandTranslation {
  // Bookmarks in Sapling = Branches in Git
  
  if (args.includes('--list-subscriptions')) {
    // This is a Sapling-specific feature, return empty for now
    return {
      command: 'git',
      args: ['branch', '--list'],
      transformOutput: () => '[]', // Return empty array
    };
  }
  
  // Parse bookmark create/move command
  // sl bookmark <name> -r <rev> → git branch <name> <rev>
  // sl bookmark -f <name> -r <rev> → git branch -f <name> <rev>
  
  let name = '';
  let rev = '';
  let force = false;
  const otherArgs: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-r' || args[i] === '--rev') {
      rev = args[i + 1] || '';
      i++; // Skip next arg
    } else if (args[i] === '-f' || args[i] === '--force') {
      force = true;
    } else if (args[i] === '-d' || args[i] === '--delete') {
      // Delete bookmark
      otherArgs.push('--delete');
    } else if (!args[i].startsWith('-')) {
      name = args[i];
    } else {
      otherArgs.push(args[i]);
    }
  }
  
  const branchArgs = ['branch'];
  if (force) branchArgs.push('-f');
  branchArgs.push(...otherArgs);
  if (name) branchArgs.push(name);
  if (rev) branchArgs.push(rev);
  
  return {
    command: 'git',
    args: branchArgs,
  };
}

function translateGotoCommand(args: Array<string>, ctx: RepositoryContext): CommandTranslation {
  // Handle goto with --rev flag and revsets
  // sl goto --rev <revset> → git checkout <commit-hash>
  
  let target = args[0] || 'HEAD';
  
  // Check for --rev flag
  const revIndex = args.indexOf('--rev');
  if (revIndex !== -1 && args[revIndex + 1]) {
    target = args[revIndex + 1];
  }
  
  // Strip Sapling revset functions (we can't evaluate them in git)
  // max(successors(hash)) → hash
  // For now, just extract the hash from common patterns
  target = target
    .replace(/max\(successors\(([^)]+)\)\)/g, '$1')  // max(successors(hash)) → hash
    .replace(/successors\(([^)]+)\)/g, '$1')         // successors(hash) → hash
    .replace(/predecessors\(([^)]+)\)/g, '$1')       // predecessors(hash) → hash
    .replace(/max\(([^)]+)\)/g, '$1')                // max(expr) → expr
    .replace(/min\(([^)]+)\)/g, '$1');               // min(expr) → expr
  
  return {
    command: 'git',
    args: ['checkout', target],
  };
}

function translateConfigCommand(args: Array<string>, ctx: RepositoryContext): CommandTranslation {
  // Handle -Tjson flag (Sapling-specific)
  const hasTJson = args.includes('-Tjson');
  
  if (hasTJson) {
    // Remove -Tjson and get the config sections
    const sections = args.filter(arg => arg !== '-Tjson');
    
    // Git doesn't have -Tjson, we need to get configs individually
    // For now, return empty JSON array since we can't easily replicate Sapling's behavior
    // The code will handle missing configs gracefully
    return {
      command: 'git',
      args: ['config', '--list'],
      transformOutput: (output) => {
        // Parse git config --list output and filter to requested sections
        const lines = output.split('\n').filter(l => l.trim());
        const configs: Array<{name: string; value: string}> = [];
        
        for (const line of lines) {
          const [name, ...valueParts] = line.split('=');
          if (!name) continue;
          
          // Check if this config matches any requested section
          const matchesSection = sections.length === 0 || sections.some(section => 
            name.startsWith(section + '.')
          );
          
          if (matchesSection) {
            configs.push({
              name,
              value: valueParts.join('='),
            });
          }
        }
        
        return JSON.stringify(configs);
      },
    };
  }
  
  // Regular config command (set, get, etc.)
  return {
    command: 'git',
    args: ['config', ...args],
  };
}

function translateResolveCommand(args: Array<string>): CommandTranslation {
  // Merge conflict resolution
  if (args.includes('--list') || args.includes('--all')) {
    // List conflicts
    return {
      command: 'git',
      args: ['diff', '--name-only', '--diff-filter=U'],
      transformOutput: transformGitConflictsToJson,
    };
  }
  
  // Mark as resolved
  if (args.includes('--mark')) {
    const file = args[args.indexOf('--mark') + 1];
    return {
      command: 'git',
      args: ['add', file],
    };
  }
  
  return {
    command: 'git',
    args: ['merge', '--continue'],
  };
}

// Output transformation functions

function transformGitStatusToJson(output: string): string {
  // Transform git status --porcelain=v2 to ISL-expected JSON format
  // Format documentation: https://git-scm.com/docs/git-status#_porcelain_format_version_2
  
  const lines = output.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  const files: Array<{path: string; status: string; renamedFrom?: string}> = [];
  
  for (const line of lines) {
    const parts = line.split(' ');
    const type = parts[0];
    
    if (type === '1') {
      // Ordinary changed entry: 1 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <path>
      // XY is a 2-char status (index and working tree)
      // We care about working tree status (second char)
      const xy = parts[1];
      const workingTreeStatus = xy[1];
      const path = parts.slice(8).join(' ');
      
      // Map git status chars to ISL status chars
      const status = mapGitStatusChar(workingTreeStatus);
      if (status) {
        files.push({path, status});
      }
    } else if (type === '2') {
      // Renamed/copied entry: 2 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <X><score> <path><sep><origPath>
      const xy = parts[1];
      const workingTreeStatus = xy[1];
      // Path is after the score field, tab-separated for original path
      const pathPart = parts.slice(9).join(' ');
      const [path, origPath] = pathPart.split('\t');
      
      files.push({
        path,
        status: mapGitStatusChar(workingTreeStatus) || 'M',
        renamedFrom: origPath,
      });
    } else if (type === '?') {
      // Untracked file: ? <path>
      const path = parts.slice(1).join(' ');
      files.push({path, status: '?'});
    } else if (type === '!') {
      // Ignored file: ! <path>
      const path = parts.slice(1).join(' ');
      files.push({path, status: '!'});
    } else if (type === 'u') {
      // Unmerged entry: u <XY> <sub> <m1> <m2> <m3> <mW> <h1> <h2> <h3> <path>
      const path = parts.slice(11).join(' ');
      files.push({path, status: 'U'}); // U = unresolved conflict
    }
  }
  
  return JSON.stringify(files);
}

/**
 * Map git status characters to ISL status characters
 * Git: M (modified), A (added), D (deleted), R (renamed), C (copied), . (unmodified)
 * ISL: M, A, R, ? (untracked), ! (missing), U (unresolved)
 */
function mapGitStatusChar(gitStatus: string): string | null {
  switch (gitStatus) {
    case 'M': return 'M'; // Modified
    case 'A': return 'A'; // Added
    case 'D': return 'R'; // Deleted (ISL uses R for removed)
    case 'R': return 'M'; // Renamed (show as modified)
    case 'C': return 'A'; // Copied (show as added)
    case '.': return null; // Unmodified (skip)
    default: return 'M'; // Unknown, treat as modified
  }
}

function transformGitShowToChangedFilesFormat(output: string): string {
  // Transform git show --name-status output to match CHANGED_FILES template format
  // Expected output format:
  // Line 0: hash
  // Line 1: filesAdded (JSON array)
  // Line 2: filesModified (JSON array)
  // Line 3: filesRemoved (JSON array)
  // Line 4: <<COMMIT_END_MARK>>
  
  const lines = output.split('\n');
  const hash = lines[0] || '';
  
  const filesAdded: string[] = [];
  const filesModified: string[] = [];
  const filesRemoved: string[] = [];
  
  // Parse file status lines (skip first line which is the hash)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    
    const status = parts[0];
    const path = parts[parts.length - 1]; // Last part is always the path
    
    if (status.startsWith('A')) {
      filesAdded.push(path);
    } else if (status.startsWith('M')) {
      filesModified.push(path);
    } else if (status.startsWith('D')) {
      filesRemoved.push(path);
    } else if (status.startsWith('R')) {
      // Renamed - treat as modified
      filesModified.push(path);
    } else if (status.startsWith('C')) {
      // Copied - treat as added
      filesAdded.push(path);
    }
  }
  
  return [
    hash,
    JSON.stringify(filesAdded),
    JSON.stringify(filesModified),
    JSON.stringify(filesRemoved),
    '<<COMMIT_END_MARK>>',
  ].join('\n');
}

function markHeadCommit(output: string): string {
  // Mark the HEAD commit with @ symbol in the isDot field
  // Also parse %D output to separate local and remote branches
  
  try {
    const {execSync} = require('child_process');
    const headHash = execSync('git rev-parse HEAD', {
      encoding: 'utf-8',
      cwd: process.cwd(),
      env: process.env,
    }).trim();
    
    // Split into commits
    const commits = output.split('<<COMMIT_END_MARK>>');
    const marked = commits.map(commit => {
      if (!commit.trim()) return commit;
      
      const lines = commit.split('\n');
      if (lines.length < 10) return commit;
      
      // First line is the hash
      const commitHash = lines[0];
      
      // If this is HEAD, mark line 9 (isDot field) with @
      if (commitHash === headHash) {
        lines[9] = '@';
      }
      
      // Parse line 5 (%D output) to separate local and remote branches
      // Format: "HEAD -> main, origin/main, tag: v1.0"
      const refsLine = lines[5];
      if (refsLine && refsLine.trim()) {
        const {localBranches, remoteBranches} = parseGitRefs(refsLine);
        // Line 5 = local bookmarks (null-terminated)
        lines[5] = localBranches.join('\0') + (localBranches.length ? '\0' : '');
        // Line 6 = remote bookmarks (null-terminated)
        lines[6] = remoteBranches.join('\0') + (remoteBranches.length ? '\0' : '');
      }
      
      // Add file count (line 11)
      // Use git diff-tree to count files changed in this commit
      try {
        const fileCount = execSync(`git diff-tree --no-commit-id --name-only -r ${commitHash}`, {
          encoding: 'utf-8',
          cwd: process.cwd(),
          env: process.env,
        }).trim().split('\n').filter(l => l.trim()).length;
        lines[11] = fileCount.toString();
      } catch {
        lines[11] = '0'; // Keep default if command fails
      }
      
      return lines.join('\n');
    });
    
    return marked.join('<<COMMIT_END_MARK>>');
  } catch (error) {
    // If we can't get HEAD, just return unchanged
    return output;
  }
}

/**
 * Parse git %D output into local and remote branches
 * Input: "HEAD -> main, origin/main, tag: v1.0"
 * Output: {localBranches: ['main'], remoteBranches: ['origin/main']}
 */
function parseGitRefs(refsString: string): {localBranches: string[]; remoteBranches: string[]} {
  const localBranches: string[] = [];
  const remoteBranches: string[] = [];
  
  if (!refsString || refsString === '\0') {
    return {localBranches, remoteBranches};
  }
  
  // Split by comma
  const refs = refsString.split(',').map(r => r.trim());
  
  for (const ref of refs) {
    // Skip empty refs
    if (!ref) continue;
    
    // Skip "HEAD ->" prefix
    if (ref.startsWith('HEAD -> ')) {
      const branch = ref.substring('HEAD -> '.length);
      if (branch && !remoteBranches.includes(branch)) {
        localBranches.push(branch);
      }
      continue;
    }
    
    // Skip tags for now (ISL uses tags differently)
    if (ref.startsWith('tag: ')) {
      continue;
    }
    
    // Check if it's a remote branch (contains /)
    if (ref.includes('/')) {
      remoteBranches.push(ref);
    } else {
      // Local branch
      if (!localBranches.includes(ref)) {
        localBranches.push(ref);
      }
    }
  }
  
  return {localBranches, remoteBranches};
}

function transformGitLogToIslFormat(output: string): string {
  // Transform git log --graph output to match ISL's template format
  // ISL uses templates.ts to parse this, so we need to match the expected format
  // For now, pass through - the templates.ts parser should handle standard git log format
  return output;
}

function transformGitBlameToJson(output: string): string {
  // Transform git blame --line-porcelain to JSON
  // Simplified version
  return output;
}

function transformGitConflictsToJson(output: string): string {
  // Transform list of conflicted files to JSON format expected by ISL
  const files = output.split('\n').filter(f => f.trim());
  return JSON.stringify({
    command: files.length > 0 ? 'merge' : null,
    conflicts: files.map(path => ({
      path,
      status: 'unresolved',
    })),
  });
}

/**
 * Create a git format string that matches ISL's expected template output.
 * ISL expects commits separated by newlines with COMMIT_END_MARK at the end.
 * Each commit should have fields in a specific order matching mainFetchTemplateFields.
 */
function createGitFormatForIslTemplate(): string {
  const COMMIT_END_MARK = '<<COMMIT_END_MARK>>';
  const NULL_CHAR = '%x00';
  
  // Format string matching the order of mainFetchTemplateFields:
  // hash, title, author, date, phase, bookmarks, remoteBookmarks, parents,
  // grandparents, isDot, files, totalFileCount, successorInfo, closestPredecessors,
  // diffId, isFollower, stableCommitMetadata, description
  
  const format = [
    '%H',                           // hash
    '%s',                           // title (subject = first line of message)
    '%an',                          // author name
    '%cI',                          // committer date ISO 8601
    'public',                       // phase (git doesn't have this, use 'public' for all)
    '%D' + NULL_CHAR,               // bookmarks (branches/tags)
    '',                             // remoteBookmarks (empty for now)
    '%P' + NULL_CHAR,               // parents (space-separated, convert to null-separated)
    '',                             // grandparents (not easy to get in git, leave empty)
    '',                             // isDot (will be set by markHeadCommit)
    '',                             // files (empty for now, too expensive)
    '0',                            // totalFileCount (0 for now)
    '',                             // successorInfo (git doesn't have mutations)
    '',                             // closestPredecessors (git doesn't have this)
    '',                             // diffId (empty for now)
    '{}',                           // isFollower (empty JSON object)
    '',                             // stableCommitMetadata (empty)
    '%B',                           // description (full commit message body)
    COMMIT_END_MARK,
  ].join('%n');  // %n is newline in git format
  
  return format;
}

function convertSaplingTemplateToGitFormat(template: string): string {
  // Convert Sapling template syntax to git --format syntax
  // This is a simplified mapping, will need expansion
  return template
    .replace(/{node}/g, '%H')
    .replace(/{node\|short}/g, '%h')
    .replace(/{desc}/g, '%s')
    .replace(/{author}/g, '%an')
    .replace(/{date}/g, '%ad')
    .replace(/{branch}/g, '%D');
}

export function getGitCommand(ctx: RepositoryContext): string {
  // Always use 'git' as the base command
  return 'git';
}

