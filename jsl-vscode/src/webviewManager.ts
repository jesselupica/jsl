/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as vscode from 'vscode';
import type {ServerManager} from './serverManager';

export class WebviewManager {
  private panel: vscode.WebviewPanel | null = null;

  constructor(
    private context: vscode.ExtensionContext,
    private serverManager: ServerManager,
  ) {}

  show(): void {
    if (this.panel) {
      // Panel already exists, just reveal it
      this.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    // Create new panel
    this.panel = vscode.window.createWebviewPanel(
      'jslSmartlog',
      'JSL SmartLog',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [],
      }
    );

    // Set the HTML content
    this.panel.webview.html = this.getWebviewContent();

    // Handle panel disposal
    this.panel.onDidDispose(() => {
      this.panel = null;
    });
  }

  refresh(): void {
    if (this.panel) {
      this.panel.webview.html = this.getWebviewContent();
    }
  }

  dispose(): void {
    this.panel?.dispose();
    this.panel = null;
  }

  private getWebviewContent(): string {
    if (!this.serverManager.isReady()) {
      return this.getLoadingHtml();
    }

    const serverUrl = this.serverManager.getUrl();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JSL SmartLog</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }
    iframe {
      border: none;
      width: 100%;
      height: 100%;
      display: block;
    }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
    }
  </style>
</head>
<body>
  <iframe src="${serverUrl}" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
</body>
</html>`;
  }

  private getLoadingHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JSL SmartLog</title>
  <style>
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
    }
  </style>
</head>
<body>
  <div class="loading">
    <p>Starting JSL server...</p>
  </div>
</body>
</html>`;
  }
}

