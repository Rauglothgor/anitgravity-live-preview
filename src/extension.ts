/**
 * VS Code Extension for Obsidian Live Preview in Google Antigravity
 *
 * This extension integrates the CodeMirror 6-based live preview editor
 * into Google Antigravity by replacing the default markdown editor view.
 */

import * as vscode from 'vscode';
import * as path from 'path';

interface EditorSession {
  panel: vscode.WebviewPanel;
  document: vscode.TextDocument;
  disposables: vscode.Disposable[];
}

const editorSessions = new Map<string, EditorSession>();

export function activate(context: vscode.ExtensionContext) {
  console.log('Obsidian Live Preview extension activated');

  // Command: Enable live preview for current file
  const enableCommand = vscode.commands.registerCommand(
    'obsidian-live-preview.enable',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      if (editor.document.languageId !== 'markdown') {
        vscode.window.showErrorMessage('This file is not markdown');
        return;
      }

      await createLivePreviewEditor(editor.document, context);
    }
  );

  // Command: Disable live preview
  const disableCommand = vscode.commands.registerCommand(
    'obsidian-live-preview.disable',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const sessionKey = editor.document.uri.toString();
        const session = editorSessions.get(sessionKey);
        if (session) {
          session.panel.dispose();
          session.disposables.forEach(d => d.dispose());
          editorSessions.delete(sessionKey);
          vscode.window.showInformationMessage('Live preview disabled');
        }
      }
    }
  );

  // Command: Toggle live preview
  const toggleCommand = vscode.commands.registerCommand(
    'obsidian-live-preview.toggle',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'markdown') {
        return;
      }

      const sessionKey = editor.document.uri.toString();
      if (editorSessions.has(sessionKey)) {
        vscode.commands.executeCommand('obsidian-live-preview.disable');
      } else {
        vscode.commands.executeCommand('obsidian-live-preview.enable');
      }
    }
  );

  // Auto-enable for markdown files if configured
  const shouldAutoEnable = vscode.workspace.getConfiguration('obsidian-live-preview').get('enabled');
  if (shouldAutoEnable) {
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.languageId === 'markdown') {
        const sessionKey = editor.document.uri.toString();
        if (!editorSessions.has(sessionKey)) {
          createLivePreviewEditor(editor.document, context);
        }
      }
    });
  }

  context.subscriptions.push(enableCommand, disableCommand, toggleCommand);
}

async function createLivePreviewEditor(
  document: vscode.TextDocument,
  context: vscode.ExtensionContext
) {
  const sessionKey = document.uri.toString();

  // Cleanup existing session
  const existingSession = editorSessions.get(sessionKey);
  if (existingSession) {
    existingSession.panel.dispose();
    existingSession.disposables.forEach(d => d.dispose());
  }

  // Create webview panel
  const panel = vscode.window.createWebviewPanel(
    'obsidianLivePreview',
    `Live Preview: ${path.basename(document.fileName)}`,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      enableCommandUris: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(context.extensionPath, 'out')),
        vscode.Uri.file(path.join(context.extensionPath, 'media')),
      ],
    }
  );

  // Get resource URIs
  const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'out', 'editor.js'))
  );
  const styleUri = panel.webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'editor.css'))
  );

  // Set initial HTML
  panel.webview.html = getWebviewContent(scriptUri, styleUri, document.getText());

  const disposables: vscode.Disposable[] = [];

  // Sync changes from VS Code editor to webview
  const docChangeListener = vscode.workspace.onDidChangeTextDocument((e) => {
    if (e.document === document) {
      panel.webview.postMessage({
        command: 'updateContent',
        content: document.getText(),
      });
    }
  });

  // Listen for messages from webview
  const messageListener = panel.webview.onDidReceiveMessage(async (message) => {
    switch (message.command) {
      case 'updateFromEditor':
        // Update VS Code editor from webview changes
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
          document.uri,
          new vscode.Range(
            new vscode.Position(0, 0),
            document.lineAt(document.lineCount - 1).range.end
          ),
          message.content
        );
        await vscode.workspace.applyEdit(edit);
        break;

      case 'ready':
        console.log('Live preview editor ready');
        break;

      case 'log':
        console.log('Editor:', message.message);
        break;
    }
  });

  // Cleanup on panel close
  const panelDisposeListener = panel.onDidDispose(() => {
    disposables.forEach(d => d.dispose());
    editorSessions.delete(sessionKey);
  });

  disposables.push(docChangeListener, messageListener, panelDisposeListener);

  // Store session
  editorSessions.set(sessionKey, {
    panel,
    document,
    disposables,
  });
}

function getWebviewContent(
  scriptUri: vscode.Uri,
  styleUri: vscode.Uri,
  initialDoc: string
): string {
  // Escape for HTML
  const escapedDoc = initialDoc
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Obsidian Live Preview</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <div id="editor" class="editor-container"></div>

    <script src="${scriptUri}"></script>
    <script>
        // Initialize editor with initial content
        window.initializeEditor(\`${escapedDoc}\`);
    </script>
</body>
</html>`;
}

export function deactivate() {
  // Cleanup all sessions
  editorSessions.forEach((session) => {
    session.panel.dispose();
    session.disposables.forEach(d => d.dispose());
  });
  editorSessions.clear();
}
