/**
 * Webview Editor Script
 *
 * Runs in the webview context and manages the CodeMirror 6 editor
 * with Antigravity-style live preview rendering.
 */

import { EditorView } from '@codemirror/view';
import { createObsidianLivePreviewEditor, getEditorContent, setEditorContent, setEditorMode, PreviewMode } from '../editor/obsidianLivePreviewEditor';

declare global {
  interface Window {
    initializeEditor: (content: string, mode?: PreviewMode) => void;
    acquireVsCodeApi: () => {
      postMessage: (message: unknown) => void;
      getState: () => unknown;
      setState: (state: unknown) => void;
    };
  }
}

let editorView: EditorView | null = null;
let updateTimeout: ReturnType<typeof setTimeout> | null = null;
const UPDATE_DEBOUNCE = 150;

// Get VS Code API
const vscode = window.acquireVsCodeApi();

/**
 * Initialize the editor in the webview
 */
window.initializeEditor = function (initialContent: string, initialMode: PreviewMode = 'live-preview') {
  const editorContainer = document.getElementById('editor');
  if (!editorContainer) {
    console.error('Editor container not found');
    return;
  }

  try {
    // Create the editor
    editorView = createObsidianLivePreviewEditor(editorContainer, initialContent, {
      theme: 'dark',
      mode: initialMode,
    });

    // Setup change listener using EditorView.updateListener
    editorView.dom.addEventListener('input', () => {
      if (updateTimeout) clearTimeout(updateTimeout);

      updateTimeout = setTimeout(() => {
        if (editorView) {
          const content = getEditorContent(editorView);
          // Send changes to VS Code
          vscode.postMessage({
            command: 'updateFromEditor',
            content: content,
          });
        }
      }, UPDATE_DEBOUNCE);
    });

    // Listen for wikilink clicks and forward to extension
    document.addEventListener('wikilink-click', (e: Event) => {
      const customEvent = e as CustomEvent;
      vscode.postMessage({
        command: 'openWikilink',
        target: customEvent.detail.target,
      });
    });

    // Notify VS Code we're ready
    vscode.postMessage({
      command: 'ready',
    });
  } catch (error) {
    console.error('Failed to initialize editor:', error);
    vscode.postMessage({
      command: 'log',
      message: `Initialization error: ${error}`,
    });
  }
};

/**
 * Handle messages from VS Code
 */
window.addEventListener('message', (event) => {
  const message = event.data;

  switch (message.command) {
    case 'updateContent':
      if (editorView) {
        const currentContent = getEditorContent(editorView);
        // Only update if content actually changed
        if (currentContent !== message.content) {
          setEditorContent(editorView, message.content);
        }
      }
      break;

    case 'setMode':
      if (editorView && message.mode) {
        setEditorMode(editorView, message.mode as PreviewMode);
      }
      break;
  }
});

// Export for global access
export { editorView, getEditorContent, setEditorContent };
