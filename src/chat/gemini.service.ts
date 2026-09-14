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

    return message;
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

Keep responses concise, natural, and conversational.

Do not use Markdown tables.
Do not include internal tool information.

Your response MUST be a JSON object with exactly these fields:

{
  "message": "string",
  "images": ["string"]
}

Rules for "message":
- Write only the message that should be sent to the Facebook user.
- Do not wrap the message in Markdown unnecessarily.
- Do not include JSON inside the message.

Rules for "images":
- "images" must always be an array.
- Each item must be a single raw image URL.
- NEVER use Markdown links.
- NEVER use Markdown formatting such as **, [], or () around an image URL.
- NEVER add descriptions, labels, or other text to an image URL.
- Only include image URLs that actually exist in the product data returned by tools.
- Never invent, modify, or guess an image URL.
- If no image should be sent, return an empty array.

When the user asks to see, show, view, or send a product image:
- Find the relevant product in the tool results.
- Select the appropriate image URL from that product's "images" field.
- Put the raw URL directly into the "images" array.

Example with an image:
{
  "message": "এই ঘড়িটির দাম ১২০০ টাকা।",
  "images": [
    "https://admin.sohojkroy.com/storage/products/gallery/example.png"
  ]
}

Example without an image:
{
  "message": "এই ঘড়িটির দাম ১২০০ টাকা।",
  "images": []
}

Return ONLY the JSON object.
  `.trim();
    }

    return base;
  }
}
