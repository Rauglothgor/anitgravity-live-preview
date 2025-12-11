import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    const extensionId = 'antigravity.obsidian-live-preview-antigravity';

    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension(extensionId);
        assert.ok(extension, `Extension ${extensionId} should be present`);
        if (!extension.isActive) {
            await extension.activate();
        }
    });

    test('Extension should be active', () => {
        const extension = vscode.extensions.getExtension(extensionId);
        assert.ok(extension && extension.isActive, 'Extension should be active');
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        const expectedCommands = [
            'obsidian-live-preview.enable',
            'obsidian-live-preview.disable',
            'obsidian-live-preview.toggle'
        ];

        expectedCommands.forEach(cmd => {
            assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
        });
    });
});
