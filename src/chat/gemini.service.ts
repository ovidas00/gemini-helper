import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, type Part } from '@google/genai';

import { chatTools, executeTool } from './chat.tools';

@Injectable()
export class GeminiService {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.config.getOrThrow<string>('GEMINI_API_KEY'),
    });

    this.model = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-3.1-flash-lite';
  }

  async chat(message: string) {
    let response = await this.client.models.generateContent({
      model: this.model,
      contents: message,
      config: {
        systemInstruction: `
You are a helpful assistant.

You have access to several tools.
Use them when they are useful instead of guessing.

Available tools can perform simple calculations,
retrieve server information, and get the current time.
      `.trim(),

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
        toolCalls: [],
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
        systemInstruction: `
You are a helpful assistant.

Use the tool results to answer the user's question.
Do not mention internal tool mechanics unless useful.
      `.trim(),

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
}
