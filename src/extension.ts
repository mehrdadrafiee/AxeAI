import * as dotenv from 'dotenv'
import * as vscode from 'vscode';
import axios, { AxiosResponse } from 'axios';

dotenv.config();

interface Message {
  role: 'system' | 'user';
  content: string;
}

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface CompletionResponse {
  choices: [{ message: { content: string }, finish_reason: string }];
  usage: Usage
}

// This function sends the content of the current file to the "/api/request" endpoint
async function sendContentToChatGPT(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active file in the editor.');
    return;
  }
  const document = editor.document;
  const content = document.getText();
  const openaiEndpoint = 'https://api.openai.com/v1/chat/completions';

  const generateMessages = (firstCall: boolean, content: string, continuation: string): Message[] => {
    return [{
      role: 'system',
      content: 'You are a code optimizer'
    }, {
      role: 'user',
      content: firstCall ? `make this piece of code better (code only): ${content}` : continuation
    }];
  };

  try {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      cancellable: false
    }, async (progress: vscode.Progress<{ message?: string }>) => {
      progress.report({ message: 'Optimizing your code... 🪄' });

      const requestOptions = {
        max_tokens: 200,
        temperature: 0.3,
        n: 1,
        model: 'gpt-3.5-turbo',
      };

      const requestHeaders = {
        'Authorization': `Bearer ${process.env.CHATGPT_API_KEY}`,
        'Content-Type': 'application/json',
      }

      let response: AxiosResponse<CompletionResponse> = await <any>axios.post(openaiEndpoint, {
        messages: generateMessages(true, content, ''),
        ...requestOptions
      }, {
        headers: { ...requestHeaders }
      });

      // Process the response from ChatGPT
      let completeResponse = response.data.choices[0].message.content;

      while (response.data.choices[0].finish_reason !== 'stop') {
        const continuation = completeResponse;
        const nextResponse: AxiosResponse<CompletionResponse> = await axios.post(openaiEndpoint, {
          messages: generateMessages(false, content, continuation),
          ...requestOptions
        }, {
          headers: { ...requestHeaders }
        });

        completeResponse += nextResponse.data.choices[0].message.content;
        response = nextResponse;
      }

      const codeRegex = /```([\s\S]*?)```/g;
      const codeMatches = [...completeResponse.matchAll(codeRegex)];
      const extractedContent = codeMatches.map(match => match[1]).join('\n\n');

      // Replace the content of the current file with the optimized code
      const start = new vscode.Position(0, 0);
      const end = document.lineAt(document.lineCount - 1).range.end;
      const range = new vscode.Range(start, end);
      editor.edit((editBuilder) => {
        editBuilder.replace(range, extractedContent);
      });

      const tokensUsed = response.data.usage.total_tokens;
      const cost = ((tokensUsed * 0.002) / 1000).toFixed(4);

      let vsCodeMessage = `
        Your code has been optimized successfully!\n\n
        Total tokens used: ${tokensUsed}.\n\n
        Total cost: $${cost}
      `;

      if (start === end) {
        vscode.window.showErrorMessage('Something went wrong! Please try again.');
      } else {
        vscode.window.showInformationMessage(vsCodeMessage);
      }
    });
  } catch (error) {
    vscode.window.showErrorMessage('Failed to optimize your code. Please try again.');
    console.error(error);
  }
}

// This function is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {
  // Register a command to send the content of the current file to ChatGPT
  context.subscriptions.push(vscode.commands.registerCommand('extension.optimizeCode', sendContentToChatGPT));
}

// This function is called when the extension is deactivated
export function deactivate() { }