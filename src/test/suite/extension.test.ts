import * as assert from 'assert';
import * as vscode from 'vscode';
import * as extension from '../../../src/extension';

describe('Extension Tests', () => {
  beforeEach(() => {
    // Activate the extension before each test
    return vscode.extensions.getExtension('HilbertAI-LLC.HilbertAI')?.activate();
  });

  afterEach(() => {
    // Reset the active text editor after each test
    return vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  it('should optimize code when the command is executed', async () => {
    const testCode = `
      // Test code to optimize
      function sum(a, b) {
        return a + b;
      }
    `;

    // Open a new untitled document with the test code
    const document = await vscode.workspace.openTextDocument({
      content: testCode,
      language: 'javascript'
    });
    await vscode.window.showTextDocument(document);

    // Execute the command to optimize the code
    await vscode.commands.executeCommand('extension.optimizeCode');

    // Get the modified code from the active text editor
    const editor = vscode.window.activeTextEditor;
    const modifiedCode = editor?.document.getText();

    // Assert that the code has been optimized
    assert.strictEqual(modifiedCode?.includes('const sum = (a, b) => a + b;'), true);
  });

  it('should handle empty file', async () => {
    // Open a new untitled document with no content
    const document = await vscode.workspace.openTextDocument();
    await vscode.window.showTextDocument(document);

    // Execute the command to optimize the code
    await vscode.commands.executeCommand('extension.optimizeCode');

    // Get the modified code from the active text editor
    const editor = vscode.window.activeTextEditor;
    const modifiedCode = editor?.document.getText();

    // Assert that the code remains empty
    assert.strictEqual(modifiedCode?.length, 0);
  });

  it('should handle unsupported file types', async () => {
    const testCode = `
      <html>
        <head>
          <title>Test Page</title>
        </head>
        <body>
          <h1>Hello, World!</h1>
        </body>
      </html>
    `;

    // Open a new untitled document with HTML code
    const document = await vscode.workspace.openTextDocument({
      content: testCode,
      language: 'html'
    });
    await vscode.window.showTextDocument(document);

    // Execute the command to optimize the code
    await vscode.commands.executeCommand('extension.optimizeCode');

    // Get the modified code from the active text editor
    const editor = vscode.window.activeTextEditor;
    const modifiedCode = editor?.document.getText();

    // Assert that the code remains unchanged
    assert.strictEqual(modifiedCode, testCode);
  });

  it('should handle failure to optimize code', async () => {
    const testCode = `
      // Test code to optimize
      function sum(a, b) {
        return a + b;
    `;

    // Open a new untitled document with the test code
    const document = await vscode.workspace.openTextDocument({
      content: testCode,
      language: 'javascript'
    });
    await vscode.window.showTextDocument(document);

    // Execute the command to optimize the code
    await vscode.commands.executeCommand('extension.optimizeCode');

    // Get the modified code from the active text editor
    const editor = vscode.window.activeTextEditor;
    const modifiedCode = editor?.document.getText();

    // Assert that the code remains unchanged
    assert.strictEqual(modifiedCode, testCode);
  });
});
