/**
 * VS Code Extension for Antigravity Live Preview
 *
 * This extension integrates the CodeMirror 6-based live preview editor
 * into Google Antigravity by replacing the default markdown editor view.
 */

import * as vscode from 'vscode';
import * as path from 'path';

type PreviewMode = 'source' | 'live-preview' | 'reading';

interface EditorSession {
  panel: vscode.WebviewPanel;
  document: vscode.TextDocument;
  disposables: vscode.Disposable[];
  mode: PreviewMode;
}

const editorSessions = new Map<string, EditorSession>();
let statusBarItem: vscode.StatusBarItem;
let lastActiveSessionKey: string | null = null;

const MODE_LABELS: Record<PreviewMode, string> = {
  'source': '$(code) Source',
  'live-preview': '$(eye) Live Preview',
  'reading': '$(book) Reading',
};

const MODE_CYCLE: PreviewMode[] = ['source', 'live-preview', 'reading'];

export function activate(context: vscode.ExtensionContext) {
  console.log('Antigravity Live Preview extension activated');

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'antigravity-live-preview.cycleMode';
  statusBarItem.tooltip = 'Click to cycle preview mode (Ctrl+E)';
  context.subscriptions.push(statusBarItem);
  updateStatusBar();

  // Command: Enable live preview for current file
  const enableCommand = vscode.commands.registerCommand(
    'antigravity-live-preview.enable',
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
    'antigravity-live-preview.disable',
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
    'antigravity-live-preview.toggle',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'markdown') {
        return;
      }

      const sessionKey = editor.document.uri.toString();
      if (editorSessions.has(sessionKey)) {
        vscode.commands.executeCommand('antigravity-live-preview.disable');
      } else {
        vscode.commands.executeCommand('antigravity-live-preview.enable');
      }
    }
  );

  // Command: Cycle through modes (Source → Live Preview → Reading)
  const cycleModeCommand = vscode.commands.registerCommand(
    'antigravity-live-preview.cycleMode',
    () => {
      const session = getActiveSession();
      if (!session) {
        vscode.window.showInformationMessage('No active live preview session');
        return;
      }

      const currentIndex = MODE_CYCLE.indexOf(session.mode);
      const nextIndex = (currentIndex + 1) % MODE_CYCLE.length;
      const nextMode = MODE_CYCLE[nextIndex];

      setSessionMode(session, nextMode);
    }
  );

  // Command: Set Source Mode
  const setSourceModeCommand = vscode.commands.registerCommand(
    'antigravity-live-preview.setSourceMode',
    () => setModeForActiveSession('source')
  );

  // Command: Set Live Preview Mode
  const setLivePreviewModeCommand = vscode.commands.registerCommand(
    'antigravity-live-preview.setLivePreviewMode',
    () => setModeForActiveSession('live-preview')
  );

  // Command: Set Reading Mode
  const setReadingModeCommand = vscode.commands.registerCommand(
    'antigravity-live-preview.setReadingMode',
    () => setModeForActiveSession('reading')
  );

  // Auto-enable for markdown files if configured
  const shouldAutoEnable = vscode.workspace.getConfiguration('antigravity-live-preview').get('enabled');
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

  context.subscriptions.push(
    enableCommand,
    disableCommand,
    toggleCommand,
    cycleModeCommand,
    setSourceModeCommand,
    setLivePreviewModeCommand,
    setReadingModeCommand
  );
}

/**
 * Get the active editor session
 * Falls back to last active session when webview panel is focused
 */
function getActiveSession(): EditorSession | undefined {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const sessionKey = editor.document.uri.toString();
    const session = editorSessions.get(sessionKey);
    if (session) {
      lastActiveSessionKey = sessionKey;
      return session;
    }
  }
  // Fallback to last active session when webview is focused
  if (lastActiveSessionKey) {
    return editorSessions.get(lastActiveSessionKey);
  }
  return undefined;
}

/**
 * Set mode for the active session
 */
function setModeForActiveSession(mode: PreviewMode) {
  const session = getActiveSession();
  if (!session) {
    vscode.window.showInformationMessage('No active live preview session');
    return;
  }
  setSessionMode(session, mode);
}

/**
 * Set mode for a specific session
 */
function setSessionMode(session: EditorSession, mode: PreviewMode) {
  session.mode = mode;

  // Send mode change to webview
  session.panel.webview.postMessage({
    command: 'setMode',
    mode: mode,
  });

  // Update status bar
  updateStatusBar();

  // Update configuration
  vscode.workspace.getConfiguration('antigravity-live-preview').update('mode', mode, true);
}

/**
 * Update the status bar item
 */
function updateStatusBar() {
  const session = getActiveSession();
  if (session) {
    statusBarItem.text = MODE_LABELS[session.mode];
    statusBarItem.show();
  } else {
    // Show default mode from config when no active session
    const configMode = vscode.workspace.getConfiguration('antigravity-live-preview').get<PreviewMode>('mode') || 'live-preview';
    statusBarItem.text = MODE_LABELS[configMode];
    statusBarItem.show();
  }
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
    'antigravityLivePreview',
    `Live Preview: ${path.basename(document.fileName)}`,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      enableCommandUris: true,
      retainContextWhenHidden: true,
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

  // Get initial mode from configuration
  const initialMode = vscode.workspace.getConfiguration('antigravity-live-preview').get<PreviewMode>('mode') || 'live-preview';

  // Set initial HTML
  panel.webview.html = getWebviewContent(scriptUri, styleUri, document.getText(), initialMode);

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

  // Track panel visibility and focus for session management
  const viewStateListener = panel.onDidChangeViewState((e) => {
    if (e.webviewPanel.active) {
      // Track this as the last active session when panel gets focus
      lastActiveSessionKey = sessionKey;
    }
    if (e.webviewPanel.visible) {
      // Re-sync content when panel becomes visible
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
        // Send initial mode to editor
        panel.webview.postMessage({
          command: 'setMode',
          mode: initialMode,
        });
        updateStatusBar();
        break;

      case 'log':
        console.log('Editor:', message.message);
        break;

      case 'openWikilink':
        await openOrCreateWikilink(message.target, document);
        break;
    }
  });

  // Cleanup on panel close
  const panelDisposeListener = panel.onDidDispose(() => {
    disposables.forEach(d => d.dispose());
    editorSessions.delete(sessionKey);
  });

  disposables.push(docChangeListener, viewStateListener, messageListener, panelDisposeListener);

  // Store session
  editorSessions.set(sessionKey, {
    panel,
    document,
    disposables,
    mode: initialMode,
  });
}

function getWebviewContent(
  scriptUri: vscode.Uri,
  styleUri: vscode.Uri,
  initialDoc: string,
  initialMode: PreviewMode
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
    <title>Antigravity Live Preview</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <div id="editor" class="editor-container"></div>

    <script src="${scriptUri}"></script>
    <script>
        // Initialize editor with initial content and mode
        window.initializeEditor(\`${escapedDoc}\`, '${initialMode}');
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

/**
 * Open an existing wikilink target or create a new file
 */
async function openOrCreateWikilink(target: string, currentDocument: vscode.TextDocument) {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentDocument.uri);
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder found');
    return;
  }

  const targetFileName = target.endsWith('.md') ? target : `${target}.md`;

  // Search for existing file
  const files = await vscode.workspace.findFiles(
    `**/${targetFileName}`,
    '**/node_modules/**',
    1
  );

  if (files.length > 0) {
    // Open existing file
    const doc = await vscode.workspace.openTextDocument(files[0]);
    await vscode.window.showTextDocument(doc);
  } else {
    // Create new file in same directory as current document
    const currentDir = path.dirname(currentDocument.uri.fsPath);
    const newFilePath = path.join(currentDir, targetFileName);
    const newFileUri = vscode.Uri.file(newFilePath);

    const edit = new vscode.WorkspaceEdit();
    edit.createFile(newFileUri, { ignoreIfExists: true });
    edit.insert(newFileUri, new vscode.Position(0, 0), `# ${target}\n\n`);
    await vscode.workspace.applyEdit(edit);

    const doc = await vscode.workspace.openTextDocument(newFileUri);
    await vscode.window.showTextDocument(doc);
  }
}
