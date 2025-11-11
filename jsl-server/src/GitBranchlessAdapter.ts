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
      return {
        command: 'git',
        args: ['checkout', ...rest],
      };

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
  // Sapling uses -Tjson, git uses --porcelain=v2 or custom format
  const newArgs = args.filter(arg => !arg.startsWith('-Tjson'));
  
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

  // For smartlog-style viewing, use git-branchless
  if (!revset || revset.includes('smartlog') || revset.includes('stack')) {
    return {
      command: 'git',
      args: ['branchless', 'smartlog', '--json'],
      usesGitBranchless: true,
      transformOutput: transformGitBranchlessSmartlogToIslFormat,
    };
  }

  // For regular log, use git log with custom format
  const gitFormat = convertSaplingTemplateToGitFormat(template);
  return {
    command: 'git',
    args: ['log', `--format=${gitFormat}`, revset || 'HEAD', ...otherArgs],
    transformOutput: template ? undefined : undefined, // May need transformation
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
  
  return {
    command: 'git',
    args: ['branch', ...args],
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
  // This is a simplified version, will need to be expanded
  const lines = output.split('\n').filter(l => l.trim());
  const files = lines.map(line => {
    const parts = line.split(' ');
    return {
      path: parts[parts.length - 1],
      status: parts[0],
    };
  });
  
  return JSON.stringify(files);
}

function transformGitBranchlessSmartlogToIslFormat(output: string): string {
  // Transform git-branchless smartlog JSON to ISL format
  // This will need significant work to match ISL's expected format
  try {
    const data = JSON.parse(output);
    // TODO: Transform git-branchless format to ISL commit format
    return output;
  } catch {
    return output;
  }
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

