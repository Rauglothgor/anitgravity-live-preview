import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    const extensionId = 'antigravity.antigravity-live-preview';

    suiteSetup(async () => {
        // Wait a bit for extension host to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));

        const extension = vscode.extensions.getExtension(extensionId);
        // Debugging help
        if (!extension) {
            console.log('Available extensions:', vscode.extensions.all.map(e => e.id));
        }

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
            'antigravity-live-preview.enable',
            'antigravity-live-preview.disable',
            'antigravity-live-preview.toggle',
            'antigravity-live-preview.cycleMode',
            'antigravity-live-preview.setSourceMode',
            'antigravity-live-preview.setLivePreviewMode',
            'antigravity-live-preview.setReadingMode'
        ];

        expectedCommands.forEach(cmd => {
            assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
        });
    });
});
