/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as vscode from 'vscode';
import {execSync} from 'node:child_process';

interface Dependency {
  name: string;
  command: string;
  required: boolean;
  installUrl: string;
}

const dependencies: Dependency[] = [
  {
    name: 'Git',
    command: 'git --version',
    required: true,
    installUrl: 'https://git-scm.com/downloads',
  },
  {
    name: 'git-branchless',
    command: 'git branchless --version',
    required: true,
    installUrl: 'https://github.com/arxanas/git-branchless',
  },
  {
    name: 'Watchman',
    command: 'watchman --version',
    required: false,
    installUrl: 'https://facebook.github.io/watchman/docs/install.html',
  },
];

function checkDependency(dep: Dependency): {installed: boolean; version?: string} {
  try {
    const output = execSync(dep.command, {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });

    // Extract version number
    const versionMatch = output.match(/(\d+\.\d+\.\d+)/);
    return {
      installed: true,
      version: versionMatch?.[1],
    };
  } catch {
    return {installed: false};
  }
}

export async function checkDependenciesForVSCode(forceShow: boolean = false): Promise<boolean> {
  const results = dependencies.map(dep => ({
    ...dep,
    ...checkDependency(dep),
  }));

  const missing = results.filter(r => r.required && !r.installed);
  const allRequired = missing.length === 0;

  // Show results if forced or if dependencies are missing
  if (forceShow || !allRequired) {
    const statusItems = results.map(r => 
      r.installed 
        ? `✓ ${r.name} ${r.version || ''}`
        : r.required
          ? `✗ ${r.name} (REQUIRED - not installed)`
          : `○ ${r.name} (optional - not installed)`
    );

    if (!allRequired) {
      const action = await vscode.window.showErrorMessage(
        `JSL is missing required dependencies:\n\n${statusItems.join('\n')}`,
        'View Installation Instructions',
        'Dismiss'
      );

      if (action === 'View Installation Instructions') {
        for (const dep of missing) {
          vscode.env.openExternal(vscode.Uri.parse(dep.installUrl));
        }
      }
    } else if (forceShow) {
      vscode.window.showInformationMessage(
        `JSL Dependencies:\n\n${statusItems.join('\n')}`
      );
    }
  }

  return allRequired;
}

