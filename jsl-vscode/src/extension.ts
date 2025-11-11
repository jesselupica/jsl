/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as vscode from 'vscode';
import {ServerManager} from './serverManager';
import {WebviewManager} from './webviewManager';
import {checkDependenciesForVSCode} from './dependencyCheck';

let serverManager: ServerManager | null = null;
let webviewManager: WebviewManager | null = null;

export async function activate(context: vscode.ExtensionContext) {
  console.log('JSL extension activating...');

  // Check dependencies first
  const depsOk = await checkDependenciesForVSCode();
  if (!depsOk) {
    return; // checkDependenciesForVSCode already showed error messages
  }

  // Get workspace root
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('JSL requires an open workspace');
    return;
  }

  // Start server
  serverManager = new ServerManager(context, workspaceRoot);
  
  try {
    await serverManager.start();
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to start JSL server: ${error}`);
    return;
  }

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('jsl.open', () => {
      if (!webviewManager) {
        webviewManager = new WebviewManager(context, serverManager!);
      }
      webviewManager.show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('jsl.refresh', () => {
      webviewManager?.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('jsl.checkDependencies', async () => {
      await checkDependenciesForVSCode(true); // force show
    })
  );

  // Auto-open if configured
  const config = vscode.workspace.getConfiguration('jsl');
  if (config.get<boolean>('autoOpen')) {
    vscode.commands.executeCommand('jsl.open');
  }

  console.log('JSL extension activated successfully');
}

export function deactivate() {
  console.log('JSL extension deactivating...');
  webviewManager?.dispose();
  serverManager?.stop();
  serverManager = null;
  webviewManager = null;
}

