/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as vscode from 'vscode';
import {spawn, ChildProcess} from 'node:child_process';
import * as path from 'node:path';

export class ServerManager {
  private process: ChildProcess | null = null;
  private port: number = 0;
  private token: string = '';
  private ready: boolean = false;

  constructor(
    private context: vscode.ExtensionContext,
    private workspaceRoot: string,
  ) {}

  async start(): Promise<void> {
    const config = vscode.workspace.getConfiguration('jsl');
    const serverPort = config.get<number>('serverPort', 0);

    // Path to the bundled server
    const serverPath = path.join(
      this.context.extensionPath,
      '../jsl-server/dist/run-proxy.js'
    );

    console.log('Starting JSL server from:', serverPath);

    // Spawn the server process
    this.process = spawn('node', [
      '--enable-source-maps',
      serverPath,
      '--port',
      serverPort.toString(),
      '--no-open',
      '--stdout',
      '--cwd',
      this.workspaceRoot,
    ], {
      cwd: this.workspaceRoot,
      env: process.env,
    });

    // Parse server output to get port and token
    return new Promise((resolve, reject) => {
      let output = '';

      const timeout = setTimeout(() => {
        reject(new Error('Server failed to start within 30 seconds'));
      }, 30000);

      this.process!.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log('[JSL Server]', text);

        // Look for the access URL
        const urlMatch = text.match(/http:\/\/localhost:(\d+)\/\?token=([a-f0-9]+)/);
        if (urlMatch) {
          this.port = parseInt(urlMatch[1]);
          this.token = urlMatch[2];
          this.ready = true;
          clearTimeout(timeout);
          resolve();
        }
      });

      this.process!.stderr?.on('data', (data) => {
        const text = data.toString();
        console.error('[JSL Server Error]', text);
        
        // Check for dependency errors
        if (text.includes('missing required dependencies')) {
          clearTimeout(timeout);
          reject(new Error('JSL dependencies not installed. Run: JSL: Check Dependencies'));
        }
      });

      this.process!.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.process!.on('exit', (code) => {
        if (code !== 0 && !this.ready) {
          clearTimeout(timeout);
          reject(new Error(`Server exited with code ${code}`));
        }
      });
    });
  }

  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.ready = false;
    }
  }

  getUrl(): string {
    if (!this.ready) {
      throw new Error('Server not ready');
    }
    return `http://localhost:${this.port}/?token=${this.token}&cwd=${encodeURIComponent(this.workspaceRoot)}`;
  }

  isReady(): boolean {
    return this.ready;
  }
}

