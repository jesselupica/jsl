/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * DependencyChecker
 * 
 * Validates that all required external dependencies are installed and accessible.
 * This is critical for VSCode extension where we can't bundle native binaries.
 */

import type {Logger} from './logger';
import {execSync} from 'node:child_process';

export interface DependencyStatus {
  name: string;
  required: boolean;
  installed: boolean;
  version?: string;
  installInstructions: string;
  installUrl?: string;
  checkCommand: string;
}

export interface DependencyCheckResult {
  allRequired: boolean;
  dependencies: DependencyStatus[];
  missingRequired: DependencyStatus[];
}

/**
 * Check if git-branchless is installed and what version
 */
async function checkGitBranchless(): Promise<DependencyStatus> {
  const status: DependencyStatus = {
    name: 'git-branchless',
    required: true,
    installed: false,
    checkCommand: 'git branchless --version',
    installUrl: 'https://github.com/arxanas/git-branchless',
    installInstructions: `JSL requires git-branchless for smartlog and stack management.

Install via:
  macOS:    brew install git-branchless
  Linux:    cargo install --locked git-branchless
  Windows:  See https://github.com/arxanas/git-branchless/releases

After installation, run: git branchless init`,
  };

  try {
    const output = execSync('git branchless --version', {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    
    const versionMatch = output.match(/git-branchless\s+(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      status.version = versionMatch[1];
      status.installed = true;
    }
  } catch (error) {
    // Not installed or not on PATH
    status.installed = false;
  }

  return status;
}

/**
 * Check if git is installed
 */
async function checkGit(): Promise<DependencyStatus> {
  const status: DependencyStatus = {
    name: 'git',
    required: true,
    installed: false,
    checkCommand: 'git --version',
    installUrl: 'https://git-scm.com/downloads',
    installInstructions: `JSL requires git version 2.30 or higher.

Install via:
  macOS:    brew install git
  Linux:    apt-get install git (or your package manager)
  Windows:  Download from https://git-scm.com/downloads`,
  };

  try {
    const output = execSync('git --version', {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    
    const versionMatch = output.match(/git version (\d+\.\d+\.\d+)/);
    if (versionMatch) {
      status.version = versionMatch[1];
      status.installed = true;
    }
  } catch (error) {
    status.installed = false;
  }

  return status;
}

/**
 * Check if Watchman is installed (optional but recommended)
 */
async function checkWatchman(): Promise<DependencyStatus> {
  const status: DependencyStatus = {
    name: 'watchman',
    required: false,
    installed: false,
    checkCommand: 'watchman --version',
    installUrl: 'https://facebook.github.io/watchman/docs/install.html',
    installInstructions: `Watchman is optional but recommended for efficient file watching.

Install via:
  macOS:    brew install watchman
  Linux:    See https://facebook.github.io/watchman/docs/install.html
  Windows:  See https://facebook.github.io/watchman/docs/install.html

Without Watchman, JSL will use slower polling to detect changes.`,
  };

  try {
    const output = execSync('watchman --version', {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    
    const versionMatch = output.match(/(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      status.version = versionMatch[1];
      status.installed = true;
    }
  } catch (error) {
    status.installed = false;
  }

  return status;
}

/**
 * Check all dependencies and return status
 */
export async function checkDependencies(logger?: Logger): Promise<DependencyCheckResult> {
  logger?.info('Checking external dependencies...');
  
  const dependencies = await Promise.all([
    checkGit(),
    checkGitBranchless(),
    checkWatchman(),
  ]);

  const missingRequired = dependencies.filter(d => d.required && !d.installed);
  
  for (const dep of dependencies) {
    if (dep.installed) {
      logger?.info(`✓ ${dep.name} ${dep.version || ''} installed`);
    } else if (dep.required) {
      logger?.error(`✗ ${dep.name} NOT INSTALLED (required)`);
    } else {
      logger?.info(`○ ${dep.name} not installed (optional)`);
    }
  }

  return {
    allRequired: missingRequired.length === 0,
    dependencies,
    missingRequired,
  };
}

/**
 * Check dependencies and throw if required ones are missing
 */
export async function validateRequiredDependencies(logger?: Logger): Promise<void> {
  const result = await checkDependencies(logger);
  
  if (!result.allRequired) {
    const errorMessage = [
      'JSL is missing required dependencies:',
      '',
      ...result.missingRequired.map(dep => 
        `${dep.name}:\n${dep.installInstructions}\n`
      ),
    ].join('\n');
    
    throw new Error(errorMessage);
  }
}

/**
 * Get dependency status for UI display
 */
export async function getDependencyStatusForUI(): Promise<{
  ready: boolean;
  dependencies: Array<{
    name: string;
    installed: boolean;
    required: boolean;
    version?: string;
    installUrl?: string;
  }>;
}> {
  const result = await checkDependencies();
  
  return {
    ready: result.allRequired,
    dependencies: result.dependencies.map(d => ({
      name: d.name,
      installed: d.installed,
      required: d.required,
      version: d.version,
      installUrl: d.installUrl,
    })),
  };
}

