import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, type Part } from '@google/genai';
import { chatTools, executeTool } from './chat.tools';

export type ChatResponseType = 'default' | 'facebook' | 'whatsapp' | 'telegram';

@Injectable()
export class GeminiService {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.config.getOrThrow<string>('GEMINI_API_KEY'),
    });

    this.model =
      this.config.get<string>('GEMINI_MODEL') ?? 'gemini-3.1-flash-lite';
  }

  async chat(message: string, responseType: ChatResponseType = 'default') {
    const systemInstruction = this.getSystemInstruction(responseType);

    let response = await this.client.models.generateContent({
      model: this.model,
      contents: message,
      config: {
        systemInstruction,

        tools: [
          {
            functionDeclarations: chatTools,
          },
        ],
      },
    });

    const functionCalls = response.functionCalls;

    if (!functionCalls?.length) {
      return {
        message: response.text,
      };
    }

    const toolResults: Part[] = [];

    for (const call of functionCalls) {
      const result = await executeTool(call.name!, call.args ?? {});

      toolResults.push({
        functionResponse: {
          name: call.name!,
          id: call.id,
          response: result,
        },
      });
    }

    const modelContent = response.candidates?.[0]?.content;

    if (!modelContent) {
      throw new Error('Gemini response did not contain model content');
    }

    response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: message,
            },
          ],
        },
        modelContent,
        {
          role: 'user',
          parts: toolResults,
        },
      ],
      config: {
        systemInstruction,

        tools: [
          {
            functionDeclarations: chatTools,
          },
        ],
      },
    });

    return {
      message: response.text,
    };
  }

  private getSystemInstruction(responseType: ChatResponseType): string {
    const base = `
You are a helpful assistant.

You have access to several tools.
Use them when they are useful instead of guessing.

Available tools can perform simple calculations,
retrieve server information, and get the current time.
    `.trim();

    if (responseType === 'facebook') {
      return `
${base}

You are responding to a Facebook Messenger user.

Keep responses concise and natural for Messenger.
Do not use Markdown tables.
Do not include JSON.
Do not include internal tool information.
Return only the message that should be sent directly to the user.
      `.trim();
    }

    return base;
  }
}
